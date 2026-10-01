/* Data & monitoring services — Amazon DynamoDB, Amazon S3, Amazon CloudWatch (schema: _schema.md, template: database.js) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "dynamodb",
  name: "Amazon DynamoDB",
  shortName: "DynamoDB",
  fullName: "Amazon DynamoDB",
  category: "database",
  icon: "⚡",
  tagline: "Serverless key/value database with single-digit-millisecond latency at any scale",
  whatIsIt: "Amazon DynamoDB is a fully managed NoSQL key/value and document database. You create tables with a partition key (and optional sort key), and AWS handles the servers, partitioning, replication across three Availability Zones, and scaling. It is accessed over HTTPS through an API rather than a persistent SQL connection, and authorization is done entirely with IAM.",
  eli5: "Imagine a giant wall of mailboxes where every box has a name written on it. If you know the name, you can open exactly that box in a blink, no matter how many millions of boxes there are. You do not have to build the wall or add more boxes when the shop gets busy; the wall just grows by itself. But if you want to find 'all boxes with a red letter inside', you have to open every single one, which is slow, so you have to plan the names carefully.",
  technical: "DynamoDB stores items (up to 400 KB each) in tables that are automatically split into partitions by hashing the partition key; each partition supports up to 3,000 read capacity units and 1,000 write capacity units per second and is replicated synchronously across three AZs in the Region. Access patterns are Query (by partition key plus sort-key condition), GetItem/BatchGetItem, and Scan; Global Secondary Indexes (GSIs) provide alternative partition/sort keys with eventual consistency, while Local Secondary Indexes (LSIs) share the table's partition key and must be defined at creation. Capacity is either on-demand (pay per request) or provisioned RCU/WCU with Application Auto Scaling; DynamoDB Streams, TTL, point-in-time recovery, transactions (TransactWriteItems), DAX caching, and global tables are optional features.",
  whyUse: [
    "Predictable single-digit-millisecond reads and writes by key, regardless of table size or request volume.",
    "No capacity planning with on-demand mode; no servers, patching, connection pools, or storage provisioning at all.",
    "Data is replicated across three AZs automatically, and point-in-time recovery restores any second in the last 35 days.",
    "Pay-per-request pricing that scales to zero for spiky or unpredictable workloads such as carts and sessions.",
    "Native features for event-driven designs: Streams trigger Lambda on every change, TTL deletes expired items for free."
  ],
  whenToUse: [
    "Shopping carts, user sessions, feature flags, and profiles: fetched and written by a known key at high volume.",
    "Counters and leaderboards (product views, likes) using atomic UpdateItem with ADD, where relational locking would be a bottleneck.",
    "Serverless applications with Lambda, where hundreds of concurrent functions would exhaust a relational database's connection limit.",
    "Event or IoT ingestion keyed by device/time, with TTL expiring old items automatically.",
    "Multi-Region active-active reads and writes via global tables when a single-Region relational primary is not acceptable."
  ],
  whenNotToUse: [
    "Ad-hoc queries, joins, and aggregations across many entities (reporting, finance): use RDS PostgreSQL/MySQL, which is the system of record for orders and payments in the reference architecture.",
    "Access patterns you cannot list up front: DynamoDB requires you to design keys and indexes around known queries; a relational schema (RDS) is more forgiving when requirements change.",
    "Storing large objects such as images, PDFs, or exports: items are capped at 400 KB, so put the blob in S3 and keep only the key in DynamoDB.",
    "Full-text search or complex filtering: Scan with FilterExpression reads (and bills) the whole table; use OpenSearch Service or a search index instead.",
    "Long-running analytics over the full data set: export the table to S3 (Export to S3 with PITR) and query with Athena rather than scanning the live table."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "DynamoDB is an AWS-managed regional service that runs outside your VPC; there is no instance to place in a subnet. ECS tasks and Lambda functions in the private app subnets reach it through the regional public endpoint (dynamodb.<region>.amazonaws.com) via the NAT Gateway, or, recommended, through a free gateway VPC endpoint that keeps traffic on the AWS network. The endpoint is public but every request must be signed with IAM credentials; there is no anonymous access.",
    securityGroup: "Not applicable — DynamoDB has no network interface in your VPC, so you cannot attach a security group to it. The calling ECS task or Lambda security group must allow outbound HTTPS (443); a gateway endpoint has no security group of its own (only an endpoint policy). Exception: an optional DAX cluster does live in your subnets and needs a security group allowing TCP 8111 (or 9111 for encrypted clusters) from the application security group.",
    nacl: "The application subnet NACL must allow outbound TCP 443 and inbound ephemeral ports (1024–65535) for the return traffic. With a gateway endpoint the destination addresses are the S3/DynamoDB public prefix list for the Region, which NACLs cannot reference; leaving the default allow-all NACL is common.",
    routeTable: "With a gateway VPC endpoint, AWS adds a route for the DynamoDB managed prefix list (pl-xxxx) with the endpoint as target to every route table you associate — usually the private app route tables. Without it, requests follow the 0.0.0.0/0 → NAT Gateway route.",
    nat: "Optional. Required only if you do not create a gateway endpoint; then private-subnet callers reach the public endpoint through the NAT Gateway and pay NAT data-processing charges. The gateway endpoint is free and recommended.",
    igw: "Not required for private callers. The Internet Gateway is only involved indirectly because the NAT Gateway sits in a public subnet; public EC2 instances with public IPs would use the IGW directly.",
    vpcOptional: "Gateway VPC endpoint (recommended, free): traffic to DynamoDB never leaves the AWS network, and the endpoint policy plus an aws:SourceVpce condition in IAM policies can restrict tables to callers inside your VPC. Interface endpoints (PrivateLink) for DynamoDB also exist for access from on-premises or peered networks, but they are billed hourly and per GB."
  },
  dataFlow: {
    in: [
      "PutItem/UpdateItem/DeleteItem/BatchWriteItem and TransactWriteItems calls from ECS tasks and Lambda over HTTPS, signed with SigV4 from the task or execution role credentials.",
      "GetItem/Query/Scan read requests from the application tier, optionally served by a DAX cache cluster in front of the table.",
      "Writes from the EventBridge → Lambda path (for example, product-view or inventory events) and from SQS consumers.",
      "Replicated writes from other Regions when global tables are enabled."
    ],
    out: [
      "Item results returned to the caller as JSON (attribute-value maps) over HTTPS.",
      "DynamoDB Streams change records (24-hour retention) consumed by Lambda event source mappings or Kinesis Data Streams for DynamoDB.",
      "Metrics (ConsumedReadCapacityUnits, ConsumedWriteCapacityUnits, ThrottledRequests, SystemErrors, SuccessfulRequestLatency) to CloudWatch; API calls to CloudTrail.",
      "On-demand backups, PITR snapshots, and Export to S3 for analytics in Athena."
    ]
  },
  networking: [
    "Callers need outbound HTTPS (443) to dynamodb.<region>.amazonaws.com; DNS resolution must work in the VPC (enableDnsSupport = true).",
    "Create a gateway VPC endpoint (com.amazonaws.<region>.dynamodb) and associate it with the private app route tables so ECS/Lambda never need NAT for DynamoDB.",
    "Lambda functions attached to the VPC have no internet access by default; they reach DynamoDB only via the gateway endpoint or a NAT Gateway route.",
    "Use the endpoint policy and aws:SourceVpce IAM conditions to ensure production tables can only be reached from inside the VPC.",
    "If you add DAX, it is a VPC resource: place the cluster in the private app subnets, create a DAX subnet group, and open TCP 8111/9111 from the application security group."
  ],
  security: {
    iam: "IAM is the only authorization layer: every API call is signed and evaluated against identity policies (and optionally resource policies on the table). Grant dynamodb:GetItem/Query/PutItem/UpdateItem on specific table and index ARNs; use the dynamodb:LeadingKeys condition to restrict a principal to items whose partition key equals its own user id.",
    securityGroups: "No security group can be attached to DynamoDB itself. The ECS task/Lambda security group must allow outbound 443; DAX clusters (optional) do use a security group.",
    nacl: "Application subnet NACLs must allow outbound 443 and inbound ephemeral return traffic; there is no DynamoDB-side NACL.",
    encryption: "All tables are encrypted at rest by default with an AWS owned key; you can choose the AWS managed key (aws/dynamodb) or a customer managed KMS key for audit and rotation control. All API traffic is TLS; the SDK can be forced to use only the VPC endpoint.",
    authentication: "Callers authenticate with SigV4-signed requests using the credentials of the ECS task role or Lambda execution role (short-lived, rotated automatically). There are no database users or passwords.",
    authorization: "IAM policies scope actions to table ARNs (arn:aws:dynamodb:<region>:<account>:table/shop-carts and .../index/*). Fine-grained access control uses conditions such as dynamodb:LeadingKeys and dynamodb:Attributes to restrict rows and columns per principal.",
    secrets: "No connection strings or passwords exist; the only 'secret' is the IAM credential the SDK obtains automatically from the task/execution role. Never create long-lived access keys for the application.",
    leastPrivilege: "Give each service its own IAM role with only the actions it uses on only its tables and indexes; deny dynamodb:Scan in production roles unless a job truly needs it, and keep dynamodb:DeleteTable/UpdateTable for the deployment pipeline."
  },
  iam: [
    "Application task/execution roles: dynamodb:GetItem, BatchGetItem, Query, PutItem, UpdateItem, DeleteItem (and BatchWriteItem / TransactWriteItems if used) on the specific table ARN and its index ARNs.",
    "Lambda consuming a stream: dynamodb:DescribeStream, GetRecords, GetShardIterator, ListStreams on the stream ARN (bundled in the AWSLambdaDynamoDBExecutionRole managed policy).",
    "Deployment pipeline/operators: dynamodb:CreateTable, UpdateTable, UpdateTimeToLive, UpdateContinuousBackups, DeleteTable, and application-autoscaling:* for provisioned-capacity auto scaling.",
    "Customer managed KMS key policy must allow the DynamoDB service principal and the callers' roles to use the key; otherwise reads fail with AccessDenied.",
    "Optional fine-grained access: add a Condition with dynamodb:LeadingKeys = ${cognito-identity.amazonaws.com:sub} (or the app's user id claim) so users can only touch their own cart items."
  ],
  scaling: [
    "On-demand capacity mode scales instantly to new traffic levels and can serve up to double the previous peak; a sudden spike beyond that may be throttled briefly while partitions split, so pre-warm before known events like a flash sale.",
    "Provisioned mode: set RCU/WCU and enable Application Auto Scaling target tracking (for example 70% utilization) for table and each GSI; cheaper than on-demand for steady traffic.",
    "Storage and partitions grow automatically with no action from you; there is no table size limit.",
    "Throughput is bounded per partition (3,000 RCU / 1,000 WCU); a hot partition key throttles even when the table has spare capacity. Adaptive capacity helps by shifting throughput to hot partitions, but cannot exceed the per-partition limit.",
    "DAX (in-memory cache, optional) offloads read-heavy, eventually consistent reads to microseconds; global tables scale reads and writes across Regions."
  ],
  availability: [
    "Every table is synchronously replicated across three Availability Zones in the Region; an AZ failure is transparent to callers, so there is no Multi-AZ option to turn on.",
    "Designed for 99.99% availability for a single-Region table and 99.999% for global tables (AWS SLA figures).",
    "Point-in-time recovery (PITR) keeps continuous backups for 35 days and restores to any second into a new table; on-demand backups persist until deleted and do not consume table capacity.",
    "Global tables replicate asynchronously to other Regions in an active-active, last-writer-wins model, giving regional disaster recovery and low-latency local reads.",
    "Deletion protection prevents accidental DeleteTable calls from Terraform or the console."
  ],
  cost: [
    "Read and write requests: on-demand bills per million read/write request units; provisioned bills per RCU/WCU-hour whether used or not. A 4 KB eventually consistent read costs 0.5 RCU, a strongly consistent read 1 RCU, a 1 KB write 1 WCU; transactions cost double.",
    "Storage per GB-month (the Standard-IA table class trades cheaper storage for pricier requests, useful for rarely read data).",
    "GSIs are billed as separate tables: every write to the base table also writes to each index that projects the changed attributes.",
    "Backups: PITR and on-demand backups per GB-month; Export to S3 per GB exported; DAX nodes per hour; global table replicated writes billed in each Region.",
    "Data transfer: free within the Region (and through a gateway endpoint), charged for cross-Region replication and for NAT Gateway processing if you skip the endpoint."
  ],
  commonMistakes: [
    "Using a low-cardinality partition key (status, country, date) so all traffic lands on one hot partition and throttles despite spare table capacity.",
    "Designing the table like a relational schema (one table per entity, then 'joining' in code with many round trips) instead of modelling access patterns, often with a single-table design.",
    "Relying on Scan with FilterExpression for lookups; it reads and bills every item in the table and gets slower as the table grows.",
    "Forgetting that GSIs are eventually consistent and have their own capacity: a throttled GSI throttles writes to the base table in provisioned mode.",
    "Not handling ProvisionedThroughputExceededException / throttling with the SDK's retries and exponential backoff, or turning retries off.",
    "Routing traffic through the NAT Gateway instead of a free gateway endpoint, paying per-GB NAT charges for every DynamoDB call.",
    "Leaving PITR and deletion protection off, then losing a table to a bad deploy or an errant Terraform destroy."
  ],
  bestPractices: [
    "Model access patterns first, then design keys: high-cardinality partition key (userId, cartId), composite sort keys (ORDER#2024-05-01#123) for range queries, and generic pk/sk attribute names for single-table design.",
    "Use on-demand mode for unpredictable or low traffic; switch to provisioned with auto scaling once traffic is steady and the savings are measurable.",
    "Enable PITR and deletion protection on every production table; test a restore into a new table.",
    "Use TTL (an epoch-seconds attribute) to expire carts and sessions automatically instead of scanning to delete them.",
    "Create a gateway VPC endpoint and restrict production tables with aws:SourceVpce; give each service its own least-privilege IAM role.",
    "Alarm on ThrottledRequests/ReadThrottleEvents/WriteThrottleEvents, SystemErrors, and SuccessfulRequestLatency; enable Contributor Insights to find hot keys.",
    "Use DynamoDB Streams + Lambda for side effects (search indexing, analytics) rather than dual writes from the application."
  ],
  creationSteps: [
    "Open the AWS Console and go to DynamoDB → Tables → Create table.",
    "Enter the table name (e.g. shop-carts), the partition key (pk, String), and the sort key (sk, String).",
    "Under Table settings choose 'Customize settings' so you can see the capacity, index, and encryption options.",
    "Keep table class 'DynamoDB Standard' and choose capacity mode 'On-demand' (or Provisioned with auto scaling if traffic is steady).",
    "Under Secondary indexes, create a Global secondary index (e.g. gsi1 with partition key gsi1pk) for the second access pattern; LSIs can only be added here at creation time.",
    "Under Encryption at rest keep the default 'Owned by Amazon DynamoDB' or select 'AWS managed key' / 'Stored in your account' (customer managed KMS key) if you need key control and audit.",
    "Turn on Deletion protection, add tags (environment, owner), and click Create table; wait for status 'Active'.",
    "Open the table → Backups tab → Point-in-time recovery → Edit → enable PITR.",
    "Open Additional settings → Time to Live → Turn on and enter the attribute name (e.g. expiresAt, epoch seconds).",
    "If downstream consumers need change events, open Exports and streams → DynamoDB stream details → Turn on with view type 'New and old images'.",
    "Create a gateway VPC endpoint for DynamoDB (VPC → Endpoints → Create → com.amazonaws.<region>.dynamodb) and associate it with the private app route tables.",
    "Attach an IAM policy to the ECS task role / Lambda execution role granting only the needed actions on the table and index ARNs, then verify with a GetItem from the application."
  ],
  productionRecommendations: [
    "On-demand mode until traffic is predictable; then provisioned + auto scaling on the table and every GSI.",
    "PITR on, deletion protection on, and a tested restore procedure.",
    "Gateway VPC endpoint with an endpoint policy; IAM roles per service scoped to table/index ARNs, no long-lived keys.",
    "TTL for carts/sessions; Streams → Lambda for derived data instead of dual writes.",
    "CloudWatch alarms on throttling, system errors, and latency; Contributor Insights for hot keys.",
    "Customer managed KMS key if compliance requires key rotation control and CloudTrail visibility of key use."
  ],
  configExample: {
    title: "Terraform — on-demand single-table design with GSI, PITR, and TTL",
    lang: "hcl",
    code: `resource "aws_dynamodb_table" "carts" {
  name                        = "shop-carts"
  billing_mode                = "PAY_PER_REQUEST"   # on-demand: no RCU/WCU planning
  hash_key                    = "pk"                # e.g. USER#123
  range_key                   = "sk"                # e.g. CART#2024-05-01
  deletion_protection_enabled = true
  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
  attribute {
    name = "gsi1pk"               # e.g. SESSION#<sessionId>
    type = "S"
  }
  global_secondary_index {
    name            = "gsi1"
    hash_key        = "gsi1pk"
    projection_type = "ALL"
  }
  ttl {
    attribute_name = "expiresAt"  # epoch seconds; expired carts vanish for free
    enabled        = true
  }

  point_in_time_recovery { enabled = true }   # 35-day continuous backup
}`
  },
  productionChecklist: [
    "Partition key has high cardinality; access patterns documented and covered by keys/GSIs (no production Scan).",
    "Capacity mode chosen deliberately (on-demand, or provisioned with auto scaling on table and all GSIs).",
    "Point-in-time recovery enabled; restore tested at least once.",
    "Deletion protection enabled.",
    "Encryption at rest: default or customer managed KMS key per compliance needs; key policy allows callers.",
    "Gateway VPC endpoint created and associated with private app route tables; NAT not used for DynamoDB.",
    "IAM roles per service scoped to table/index ARNs; aws:SourceVpce or LeadingKeys conditions where appropriate.",
    "TTL attribute configured for expiring data (carts, sessions).",
    "CloudWatch alarms on ThrottledRequests, SystemErrors, SuccessfulRequestLatency; Contributor Insights on.",
    "SDK retries with exponential backoff left enabled; application handles throttling gracefully."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "IAM is the only way to authorize DynamoDB API calls; every caller needs a role with table-scoped permissions." },
    { id: "route-tables", kind: "recommended", why: "The gateway VPC endpoint adds a prefix-list route to the private app route tables so callers avoid NAT." },
    { id: "nat-gateway", kind: "alternative", why: "Without a gateway endpoint, private-subnet callers reach the public endpoint through NAT (paid per GB)." },
    { id: "lambda", kind: "optional", why: "Common consumer of DynamoDB Streams and writer via the EventBridge → Lambda path." },
    { id: "ecs", kind: "optional", why: "ECS tasks read/write carts and sessions using the task role credentials." },
    { id: "cloudwatch", kind: "recommended", why: "Throttling, error, and latency metrics and alarms." },
    { id: "eventbridge", kind: "optional", why: "Events routed to Lambda that update counters in DynamoDB." },
    { id: "rds", kind: "alternative", why: "Relational data with joins and transactions (orders, payments) belongs in RDS." }
  ],
  related: ["rds", "s3", "lambda", "eventbridge", "iam", "cloudwatch"],
  ecommerceRole: "Holds the high-volume key/value data: shopping carts, user sessions, and product-view counters, written by ECS tasks and by the EventBridge → Lambda path. RDS remains the system of record for orders and payments; DynamoDB takes the traffic that would otherwise hammer it.",
  failure: {
    title: "DynamoDB throttles or a partition is hot",
    whatHappens: "DynamoDB itself rarely goes down: each table is replicated across three AZs, so an AZ failure is invisible to callers. The realistic failure is throttling: requests return ProvisionedThroughputExceededException (provisioned mode) or are throttled when a single partition key exceeds 3,000 RCU / 1,000 WCU per second, or when on-demand traffic more than doubles its previous peak too quickly. Carts and sessions then fail to load or save for the affected keys, and if the application does not retry with backoff, users see errors while the rest of the table works fine. A regional service event would surface as elevated SystemErrors and 5xx responses from the endpoint.",
    awsMechanisms: [
      "Synchronous replication across three AZs; no single-AZ failure mode and no failover to configure.",
      "Adaptive capacity automatically shifts throughput toward hot partitions and splits them, within the per-partition limit.",
      "AWS SDKs retry throttled and 5xx responses with exponential backoff and jitter by default.",
      "Application Auto Scaling raises provisioned capacity when consumed capacity crosses the target; on-demand mode absorbs up to 2x the previous peak.",
      "Point-in-time recovery and global tables cover data loss and regional disaster recovery."
    ],
    mitigations: [
      "Choose high-cardinality partition keys and add write sharding (suffix 0–9) for very hot counters such as a trending product's view count.",
      "Keep SDK retries on, add idempotency to writes, and degrade gracefully (serve an empty cart with a 'try again' message rather than a 500).",
      "Alarm on ThrottledRequests, ReadThrottleEvents, WriteThrottleEvents, and SystemErrors; enable Contributor Insights to name the hot key.",
      "Pre-warm on-demand tables before a planned flash sale, or switch to provisioned capacity with a headroom-friendly auto scaling target.",
      "Put DAX in front of read-heavy tables to absorb repeated reads of the same popular items."
    ]
  },
  beginnerConnectionHint: "The ECS tasks and Lambda functions talk to DynamoDB (through a VPC endpoint, not the internet), and DynamoDB reports its throttling and latency numbers to CloudWatch."
},
{
  id: "s3",
  name: "Amazon S3",
  shortName: "S3",
  fullName: "Amazon Simple Storage Service",
  category: "storage",
  icon: "🪣",
  tagline: "Durable object storage for static sites, images, uploads, logs, and backups",
  whatIsIt: "Amazon S3 is a regional object storage service: you create buckets and store objects (files plus metadata) under keys, accessed over an HTTPS REST API. It is designed for 99.999999999% (11 nines) durability by storing every object redundantly across at least three Availability Zones, and it offers storage classes, lifecycle rules, versioning, replication, and event notifications on top of that.",
  eli5: "S3 is like an enormous, very safe warehouse of labelled boxes. You hand the warehouse a box with a label, and you can ask for it back by that label whenever you want, from anywhere. The warehouse keeps secret copies of every box in three different buildings, so even if one building burns down, nothing is lost. You pay a little for the shelf space and a little each time someone asks for a box.",
  technical: "S3 exposes bucket-level and object-level operations (PutObject, GetObject, ListObjectsV2, multipart upload for objects up to 5 TB) over HTTPS with SigV4 signing; bucket names are globally unique and objects are addressed as s3://bucket/key. Since December 2020 S3 provides strong read-after-write consistency for PUT and DELETE. Access is controlled by IAM identity policies, bucket policies, Block Public Access, and Object Ownership (ACLs disabled by default); encryption at rest is on by default (SSE-S3) with SSE-KMS optional. Storage classes (Standard, Intelligent-Tiering, Standard-IA, One Zone-IA, Glacier Instant/Flexible/Deep Archive) are chosen per object and changed by lifecycle rules.",
  whyUse: [
    "Virtually unlimited, pay-as-you-go storage with 11 nines durability and no disks, RAID, or file servers to manage.",
    "Serves the static frontend (HTML/JS/CSS) and product images through CloudFront without any web servers.",
    "Decouples large binary data from the databases: RDS/DynamoDB store the key, S3 stores the bytes.",
    "Versioning and replication protect against accidental deletes and provide cross-Region disaster recovery.",
    "Event notifications turn uploads into workflows (image resize via Lambda, order-file import via SQS) with no polling."
  ],
  whenToUse: [
    "Hosting the single-page application build and product images behind CloudFront with Origin Access Control.",
    "User uploads (avatars, return photos, CSV imports) written directly from the browser via presigned URLs so the upload bytes bypass the application servers.",
    "Backups, exports, and logs: RDS snapshot exports, DynamoDB exports, ALB access logs, CloudFront logs, VPC Flow Logs, CloudTrail.",
    "Data lake / analytics files queried by Athena or loaded into Redshift.",
    "Sharing artifacts between pipeline stages (build outputs, Terraform state with a lock table)."
  ],
  whenNotToUse: [
    "A POSIX file system that many EC2 instances or containers mount and modify concurrently: use Amazon EFS (or FSx) instead.",
    "Block storage for a database or OS disk: use EBS volumes attached to EC2.",
    "Low-latency key/value lookups of small records with millisecond SLAs: use DynamoDB; S3 first-byte latency is tens of milliseconds and per-request pricing adds up.",
    "Frequently updated small pieces of a file: S3 objects are immutable and replaced whole; use a database or EFS.",
    "Serving high-traffic content directly from the bucket to the internet: put CloudFront in front for caching, TLS, lower egress cost, and to keep the bucket private."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "S3 is an AWS-managed regional service outside your VPC; buckets are not placed in subnets. In the reference architecture the buckets are private (Block Public Access on): CloudFront reads the frontend and product images through Origin Access Control, and ECS/Lambda in private subnets reach S3 through a free gateway VPC endpoint (recommended) rather than the NAT Gateway. The public S3 endpoint exists, but every request must be authorized; nothing is anonymously reachable.",
    securityGroup: "Not applicable — S3 has no network interface in your VPC, so no security group can be attached. The caller's security group (ECS tasks, Lambda, EC2) must allow outbound HTTPS 443. A gateway endpoint has no security group; only an interface endpoint (PrivateLink) would.",
    nacl: "Application subnet NACLs must allow outbound TCP 443 and inbound ephemeral ports (1024–65535) for responses. NACLs cannot filter by S3 prefix list, so most teams leave the default allow-all NACL in place.",
    routeTable: "A gateway VPC endpoint for S3 adds a route for the S3 managed prefix list (pl-xxxx) with the endpoint as target to each associated route table — associate the private app (and, if needed, DB) route tables. Without the endpoint, S3 traffic uses the 0.0.0.0/0 → NAT Gateway route.",
    nat: "Optional. Only needed if you do not create a gateway endpoint; then private-subnet uploads and downloads flow through the NAT Gateway and incur per-GB processing charges. Recommended: gateway endpoint (free).",
    igw: "Not required for private callers. Browsers upload via presigned URLs and CloudFront fetches from the bucket over the public internet/AWS backbone, none of which touches your IGW.",
    vpcOptional: "Gateway endpoint (recommended, free, same Region only) for ECS/Lambda/EC2 in the VPC; an endpoint policy can allow only your buckets, and bucket policies can require aws:SourceVpce. Interface endpoints (PrivateLink, billed) give S3 a private IP in your subnets for on-premises or cross-VPC access. S3 Access Points can also be restricted to a VPC."
  },
  dataFlow: {
    in: [
      "PutObject / multipart uploads from CI/CD (frontend build), from ECS/Lambda (generated invoices, resized images), and directly from browsers via presigned PUT URLs.",
      "Log deliveries: ALB access logs, CloudFront standard logs, VPC Flow Logs, CloudTrail, RDS snapshot exports, DynamoDB exports.",
      "Replicated objects arriving from a source bucket when Same-Region or Cross-Region Replication is configured."
    ],
    out: [
      "GetObject responses to CloudFront (via Origin Access Control) for the static site and product images; cached at the edge.",
      "GetObject/ListObjects responses to ECS tasks and Lambda (via the gateway endpoint) and to browsers via presigned GET URLs.",
      "Event notifications (s3:ObjectCreated:*, s3:ObjectRemoved:*) to SQS, SNS, Lambda, or EventBridge to trigger processing.",
      "Request metrics (AllRequests, 4xxErrors, 5xxErrors, FirstByteLatency) and daily storage metrics (BucketSizeBytes, NumberOfObjects) to CloudWatch; replicated objects to the destination bucket."
    ]
  },
  networking: [
    "Callers need outbound HTTPS (443) to <bucket>.s3.<region>.amazonaws.com; use the regional virtual-hosted-style endpoint and SDK region configuration to avoid redirects.",
    "Create a gateway VPC endpoint (com.amazonaws.<region>.s3) associated with the private app route tables so ECS and Lambda never need NAT for S3.",
    "CloudFront reaches the bucket over the AWS network using the bucket's REST endpoint as origin (not the static-website endpoint, which requires public objects and does not support OAC).",
    "Browser uploads via presigned URLs require a CORS configuration on the bucket allowing your site's origin and the PUT/POST methods.",
    "For an interface endpoint (PrivateLink) you must use the endpoint-specific DNS name; the gateway endpoint works transparently with the normal S3 hostnames."
  ],
  security: {
    iam: "Access is the union of identity policies (IAM roles/users) and the bucket policy, with explicit Deny winning; cross-account access requires the bucket policy to allow the other account. Grant s3:GetObject/PutObject on arn:aws:s3:::bucket/prefix/* and s3:ListBucket on the bucket ARN separately.",
    securityGroups: "Not applicable to S3 itself; the calling ECS task or Lambda security group must allow outbound 443.",
    nacl: "Application subnet NACLs must permit outbound 443 and inbound ephemeral ports; there is no S3-side NACL.",
    encryption: "All new objects are encrypted at rest by default with SSE-S3 (AES-256). Use SSE-KMS with a customer managed key when you need key policies, rotation control, and CloudTrail records of each decrypt; enable S3 Bucket Keys to cut KMS request costs. Enforce TLS with a bucket-policy Deny on aws:SecureTransport = false.",
    authentication: "Requests are SigV4-signed with IAM credentials (task role, execution role, CI role); presigned URLs embed a signature so a browser can upload or download one specific object for a limited time without credentials. Anonymous access is blocked by Block Public Access.",
    authorization: "Keep Block Public Access on at account and bucket level and Object Ownership = Bucket owner enforced (ACLs disabled). Allow CloudFront via a bucket policy for the cloudfront.amazonaws.com service principal conditioned on the distribution's AWS:SourceArn; allow application roles only on their prefixes.",
    secrets: "S3 needs no secrets of its own; never create long-lived IAM access keys for the app. Presigned URLs are bearer credentials: keep expiry short (minutes) and generate them server-side after authorizing the user.",
    leastPrivilege: "One bucket (or prefix) per purpose with its own policy; the frontend deploy role can write only the frontend bucket, the image service only images/*, and nobody except break-glass operators has s3:DeleteBucket or s3:PutBucketPolicy."
  },
  iam: [
    "CloudFront Origin Access Control: bucket policy Allow s3:GetObject to Principal {Service: cloudfront.amazonaws.com} with Condition StringEquals AWS:SourceArn = the distribution ARN.",
    "ECS task role / Lambda execution role: s3:GetObject, s3:PutObject (and s3:DeleteObject if needed) on arn:aws:s3:::shop-uploads/*, plus s3:ListBucket on the bucket ARN if listing; add kms:Decrypt/kms:GenerateDataKey on the bucket's KMS key for SSE-KMS.",
    "CI/CD deploy role: s3:PutObject, s3:DeleteObject, s3:ListBucket on the frontend bucket and cloudfront:CreateInvalidation on the distribution.",
    "Replication: an IAM role trusted by s3.amazonaws.com with s3:GetReplicationConfiguration, s3:ListBucket, s3:GetObjectVersion* on the source and s3:ReplicateObject/ReplicateDelete/ReplicateTags on the destination.",
    "Log delivery: the ALB access-log bucket policy must allow the regional Elastic Load Balancing account (or logdelivery.elasticloadbalancing.amazonaws.com in newer Regions); CloudFront logging requires ACLs enabled on the log bucket (Object Ownership = Bucket owner preferred)."
  ],
  scaling: [
    "Storage and object count are effectively unlimited; individual objects up to 5 TB (use multipart upload above 100 MB, required above 5 GB).",
    "Request rate scales automatically to at least 3,500 PUT/COPY/POST/DELETE and 5,500 GET/HEAD requests per second per prefix, and you can use many prefixes in parallel.",
    "CloudFront absorbs read traffic for the frontend and images at the edge, so origin requests to S3 stay a fraction of user requests.",
    "Presigned URLs let thousands of browsers upload directly to S3 without passing bytes through ECS or Lambda.",
    "S3 Transfer Acceleration (optional, billed) speeds uploads from distant users via CloudFront edge locations."
  ],
  availability: [
    "Objects in S3 Standard, Intelligent-Tiering, Standard-IA, and Glacier classes are stored redundantly across at least three AZs; One Zone-IA and Express One Zone deliberately use a single AZ.",
    "S3 Standard is designed for 99.99% availability (99.9% for Standard-IA); durability is 99.999999999% for all classes.",
    "Versioning keeps every overwrite and delete as a recoverable version; MFA Delete and Object Lock add protection against malicious deletion.",
    "Cross-Region Replication (requires versioning) copies new objects to a bucket in another Region for DR; Replication Time Control offers a 15-minute SLA.",
    "CloudFront origin groups can fail over from the primary bucket to a replica bucket in another Region when the primary returns 5xx or is unreachable."
  ],
  cost: [
    "Storage per GB-month by class: Standard is the most expensive per GB, Standard-IA and Glacier classes are cheaper per GB but charge for retrieval and have minimum durations (30/90/180 days).",
    "Requests: PUT/COPY/POST/LIST cost more per 1,000 than GET/HEAD; lifecycle transitions are billed as requests too, so avoid transitioning millions of tiny objects.",
    "Data transfer out to the internet per GB; transfer to CloudFront is free, and same-Region transfer to EC2/ECS/Lambda is free (through the gateway endpoint too).",
    "SSE-KMS adds KMS API charges per request unless S3 Bucket Keys are enabled; replication bills the replicated storage plus inter-Region transfer.",
    "Versioning silently multiplies storage for frequently overwritten objects unless a lifecycle rule expires noncurrent versions; incomplete multipart uploads also occupy paid space until aborted."
  ],
  commonMistakes: [
    "Disabling Block Public Access and adding a public-read bucket policy or ACL to make CloudFront or the app 'work', exposing every object to the internet.",
    "Using the S3 static-website endpoint as the CloudFront origin (it requires public objects) instead of the REST endpoint with Origin Access Control.",
    "Granting s3:* on arn:aws:s3:::* to the application role, so a bug or compromise can read or delete every bucket in the account.",
    "Enabling versioning without a lifecycle rule for noncurrent versions and incomplete multipart uploads, then wondering why storage cost keeps climbing.",
    "Sending all S3 traffic from private subnets through the NAT Gateway (paid per GB) because nobody created the free gateway endpoint.",
    "Using SSE-KMS at high request volume without Bucket Keys, or forgetting kms:Decrypt in the reader's role, producing puzzling AccessDenied errors.",
    "Storing objects with sequential names in one prefix and expecting per-prefix request limits to be irrelevant, or issuing a giant ListObjects to find one key instead of storing the key in the database."
  ],
  bestPractices: [
    "Block Public Access on (account and bucket), Object Ownership = Bucket owner enforced, and a bucket policy Deny for non-TLS requests.",
    "Keep buckets private and serve them only through CloudFront with Origin Access Control; deploy new frontend builds then invalidate or use hashed filenames.",
    "One bucket per purpose (frontend, product-images, uploads, logs) with least-privilege prefixes and tags for cost allocation.",
    "Versioning on for buckets holding user data, plus lifecycle rules: expire noncurrent versions after N days, abort incomplete multipart uploads after 7 days, transition cold data to Intelligent-Tiering or Glacier.",
    "Use presigned URLs with short expiry and a CORS policy for browser uploads; validate content type and size server-side after the ObjectCreated event.",
    "Use a gateway VPC endpoint for in-VPC access and restrict sensitive buckets with aws:SourceVpce; enable server access logging or CloudTrail data events for audit.",
    "Cross-Region Replication for critical buckets and a CloudFront origin group for failover; alarm on 5xxErrors and 4xxErrors request metrics."
  ],
  creationSteps: [
    "Open the AWS Console and go to S3 → Buckets → Create bucket.",
    "Enter a globally unique bucket name (e.g. shop-frontend-prod-123456789012); bucket names cannot be changed later.",
    "Choose the AWS Region where your VPC and other resources live (keeps transfer free and latency low).",
    "Under Object Ownership keep 'ACLs disabled (recommended)' so the bucket owner owns every object and access is managed by policies only.",
    "Under Block Public Access settings keep all four options checked (Block all public access) and acknowledge the reminder.",
    "Under Bucket Versioning choose Enable for buckets holding user data or builds you may need to roll back.",
    "Under Default encryption keep 'Server-side encryption with Amazon S3 managed keys (SSE-S3)' or choose SSE-KMS with your customer managed key; enable Bucket Key if using KMS.",
    "Add tags (environment, owner, cost-center) and click Create bucket.",
    "Open the bucket → Permissions → Bucket policy and paste the policy allowing s3:GetObject to the cloudfront.amazonaws.com service principal conditioned on your distribution's ARN (CloudFront can generate this when you create the OAC).",
    "Open Management → Lifecycle rules → Create rule to expire noncurrent versions and abort incomplete multipart uploads (e.g. after 30 and 7 days).",
    "For an uploads bucket, open Permissions → CORS and allow your site origin with PUT/POST/GET; then configure Properties → Event notifications to send s3:ObjectCreated:* to SQS or Lambda.",
    "Create a gateway VPC endpoint for S3 (VPC → Endpoints → com.amazonaws.<region>.s3) associated with the private app route tables, then upload a test object from an ECS task or Lambda to verify."
  ],
  productionRecommendations: [
    "Block Public Access on everywhere; access only via CloudFront OAC and IAM roles.",
    "Default encryption SSE-S3 or SSE-KMS (with Bucket Keys); bucket policy denies non-TLS requests.",
    "Versioning + lifecycle rules (noncurrent version expiry, multipart abort, tiering) on every production bucket.",
    "Gateway VPC endpoint for in-VPC callers; no S3 traffic through the NAT Gateway.",
    "Cross-Region Replication and a CloudFront origin group for the frontend/images buckets.",
    "CloudTrail data events or server access logging on buckets holding customer data; CloudWatch alarms on 5xxErrors."
  ],
  configExample: {
    title: "Terraform — private frontend bucket readable only by CloudFront (OAC)",
    lang: "hcl",
    code: `resource "aws_s3_bucket" "frontend" {
  bucket = "shop-frontend-prod-123456789012"
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Only the CloudFront distribution (via Origin Access Control) may read objects
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowCloudFrontServicePrincipalReadOnly"
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "arn:aws:s3:::shop-frontend-prod-123456789012/*"
      Condition = {
        StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.cdn.arn }
      }
    }]
  })
}`
  },
  productionChecklist: [
    "Block Public Access enabled at account level and on every bucket.",
    "Object Ownership = Bucket owner enforced (ACLs disabled).",
    "Bucket policy grants CloudFront OAC read-only, conditioned on the distribution ARN; no public statements.",
    "Bucket policy denies requests where aws:SecureTransport is false.",
    "Default encryption SSE-S3 or SSE-KMS; KMS key policy allows reader/writer roles.",
    "Versioning enabled; lifecycle rules expire noncurrent versions and abort incomplete multipart uploads.",
    "Application roles scoped to specific buckets/prefixes; no s3:* on *.",
    "Gateway VPC endpoint for S3 associated with private route tables.",
    "Cross-Region Replication (or at least versioning + backups) for irreplaceable data; CloudFront origin group configured.",
    "CloudWatch request metrics enabled with alarms on 5xxErrors; access logging or CloudTrail data events on."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Bucket policies and IAM roles are the only access control; CloudFront OAC and application roles need explicit grants." },
    { id: "cloudfront", kind: "recommended", why: "Serves the frontend and images from the private bucket with caching, TLS, and Origin Access Control." },
    { id: "route-tables", kind: "recommended", why: "The gateway VPC endpoint adds a prefix-list route to the private app route tables." },
    { id: "nat-gateway", kind: "alternative", why: "Fallback path for private-subnet callers when no gateway endpoint exists (billed per GB)." },
    { id: "lambda", kind: "optional", why: "Typical target of ObjectCreated notifications (image resizing, import jobs)." },
    { id: "sqs", kind: "optional", why: "Durable target for event notifications processed by worker tasks." },
    { id: "eventbridge", kind: "optional", why: "Receives S3 events when EventBridge notifications are enabled on the bucket." },
    { id: "cloudwatch", kind: "recommended", why: "Storage and request metrics, alarms on errors." }
  ],
  related: ["cloudfront", "rds", "dynamodb", "lambda", "sqs", "iam"],
  ecommerceRole: "Stores the static frontend build and all product images served through CloudFront, receives customer uploads via presigned URLs, and collects logs and backups (ALB/CloudFront logs, RDS and DynamoDB exports). The databases store only the object keys.",
  failure: {
    title: "S3 becomes unavailable",
    whatHappens: "A full S3 outage in a Region is rare (S3 Standard is designed for 99.99% availability and data is spread across at least three AZs), but when the regional S3 API degrades, GetObject/PutObject calls return 5xx or time out. Product images and the frontend keep working for anything already cached in CloudFront edge locations (CloudFront can also serve stale content while the origin errors), but cache misses fail, new uploads fail, log deliveries are delayed, and any Lambda or ECS code that reads S3 synchronously starts erroring. Durability is not affected: objects are not lost, they are temporarily unreachable.",
    awsMechanisms: [
      "Objects stored redundantly across at least three AZs; single-AZ failures are absorbed without any configuration.",
      "Strong read-after-write consistency and automatic request-rate scaling, so recovery does not require cache invalidation.",
      "CloudFront caching (with configurable TTLs and stale-if-error behaviour via error caching) masks short origin outages for the frontend and images.",
      "Cross-Region Replication (optionally with Replication Time Control) keeps a copy in a second Region; CloudFront origin groups fail over to it automatically on 5xx.",
      "Versioning and Object Lock protect against the more common 'failure': accidental or malicious deletion."
    ],
    mitigations: [
      "Front every user-facing bucket with CloudFront, use long cache TTLs with hashed filenames, and configure an origin group with a replicated bucket in another Region.",
      "Enable Cross-Region Replication on frontend, images, and uploads buckets; deploy builds to both buckets from CI.",
      "Make uploads asynchronous: accept the order first, queue the image processing in SQS, and retry S3 operations with exponential backoff.",
      "Alarm on S3 request metrics (5xxErrors) and CloudFront origin error rate; subscribe to the AWS Health Dashboard for S3 events.",
      "Keep operational data (carts, orders) in DynamoDB/RDS so checkout does not depend on S3 being reachable."
    ]
  },
  beginnerConnectionHint: "CloudFront reads the website files and images from S3, the app servers and browsers put uploads into it, and S3 tells SQS or Lambda whenever a new file arrives."
},
{
  id: "cloudwatch",
  name: "Amazon CloudWatch",
  shortName: "CloudWatch",
  fullName: "Amazon CloudWatch",
  category: "monitoring",
  icon: "📊",
  tagline: "Metrics, logs, alarms, and dashboards for every AWS service and your own application",
  whatIsIt: "Amazon CloudWatch is the monitoring and observability service of AWS. AWS services publish metrics to it automatically, applications and agents send logs and custom metrics, and you build alarms, dashboards, and log queries on top. Alarms can notify people through SNS or take actions such as triggering Auto Scaling.",
  eli5: "CloudWatch is like the dashboard in a car plus a friend who watches it for you. It shows how fast the engine is going, how much fuel is left, and keeps a diary of everything that happened. If the engine gets too hot, your friend beeps loudly and can even open the windows for you. Without it you would only find out something was wrong when the car stopped.",
  technical: "CloudWatch Metrics stores time-series data points identified by namespace (AWS/ECS, AWS/ApplicationELB, or a custom one), metric name, and dimensions, at standard (1-minute) or high (1-second) resolution, retained for 15 months with progressive aggregation. CloudWatch Logs ingests log events into log streams within log groups (per-group retention from 1 day to 10 years or never), queried with Logs Insights and convertible to metrics via metric filters. Alarms evaluate a metric or metric-math expression over a period × evaluation periods, move between OK, ALARM, and INSUFFICIENT_DATA, and fire actions (SNS topics, Auto Scaling policies, EC2 actions, Systems Manager); composite alarms combine other alarms with boolean logic. Container Insights, the CloudWatch agent, Synthetics canaries, and ServiceLens/X-Ray extend it to container, host, synthetic, and tracing data.",
  whyUse: [
    "Every AWS service in the architecture (ALB, ECS, Lambda, RDS, SQS, DynamoDB, NAT, API Gateway) already publishes metrics here for free; there is nothing to install for the basics.",
    "Alarms turn metrics into action: page the on-call engineer via SNS, or scale ECS services out and in through Auto Scaling policies.",
    "Centralized logs from ECS containers (awslogs driver) and Lambda (automatic) with retention control and a query language, no log servers to run.",
    "Dashboards give one screen for the whole platform during an incident or a flash sale.",
    "Metric filters, anomaly detection, and composite alarms reduce noise and catch problems a fixed threshold would miss."
  ],
  whenToUse: [
    "Production monitoring of any AWS workload: you need error rates, latency, saturation, and queue depth visible and alarmed.",
    "Driving ECS service auto scaling from CPU/memory or from ALB RequestCountPerTarget and SQS queue depth.",
    "Debugging: searching ECS and Lambda logs with Logs Insights, correlating with request IDs and X-Ray traces.",
    "Synthetic checks of the storefront and checkout API from outside with Synthetics canaries.",
    "Cost and capacity trend analysis using 15 months of metric history."
  ],
  whenNotToUse: [
    "Long-term archival or heavy analytics of raw logs: export or stream log groups to S3 (via subscription filters and Firehose) and query with Athena; CloudWatch Logs storage and Insights scans are pricier at petabyte scale.",
    "Distributed tracing of request paths across services: use AWS X-Ray (integrated with CloudWatch ServiceLens) rather than trying to reconstruct traces from logs.",
    "Reacting to state-change events (an order placed, an image uploaded): route events with EventBridge, the successor of CloudWatch Events, not with alarms.",
    "Sub-second real-time streaming analytics of metrics: Kinesis Data Streams / Managed Flink are built for that; CloudWatch alarms evaluate on 10-second to minute granularity.",
    "Managed Prometheus/Grafana-native stacks: if the team already runs OpenTelemetry with Prometheus queries, Amazon Managed Service for Prometheus and Managed Grafana are the closer fit (CloudWatch can still be a Grafana data source)."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "CloudWatch is an AWS-managed regional service outside your VPC; metrics and logs stay in the Region where they are published (CloudFront and billing metrics live in us-east-1). AWS services push their metrics internally. Your ECS tasks, Lambda functions, and EC2 agents publish logs and custom metrics to the public endpoints (logs.<region>.amazonaws.com, monitoring.<region>.amazonaws.com) via the NAT Gateway, or via interface VPC endpoints so nothing leaves the VPC. Requests are IAM-signed; nothing is anonymously reachable.",
    securityGroup: "Not applicable to CloudWatch itself — it has no network interface you own. The publishing ECS task, Lambda, or EC2 security group must allow outbound HTTPS 443. If you create interface endpoints (com.amazonaws.<region>.logs and .monitoring), those endpoints do have a security group that must allow inbound 443 from the application security group.",
    nacl: "Application subnet NACLs must allow outbound TCP 443 and inbound ephemeral ports (1024–65535) for responses; there is no CloudWatch-side NACL.",
    routeTable: "No special routes for CloudWatch itself: publishers use the 0.0.0.0/0 → NAT Gateway route from private subnets, or resolve the interface endpoint's private IPs (private DNS enabled) with only the local VPC route. Public EC2 instances use the IGW route.",
    nat: "Optional. Required for ECS/Lambda/EC2 in private subnets to reach the public CloudWatch endpoints unless you create interface VPC endpoints for logs and monitoring; AWS-service-published metrics (ALB, RDS, SQS, DynamoDB) never touch your NAT.",
    igw: "Not required for private callers; only public EC2 instances would publish through the IGW. Never place workloads in public subnets just to reach CloudWatch.",
    vpcOptional: "Interface VPC endpoints (PrivateLink) for com.amazonaws.<region>.logs and com.amazonaws.<region>.monitoring (plus .events for EventBridge and .xray for X-Ray) let private-subnet workloads publish without NAT; they cost per hour per AZ and per GB, so compare with NAT data-processing charges. Lambda in a VPC needs one of these paths to publish anything; Lambda outside a VPC publishes directly."
  },
  dataFlow: {
    in: [
      "Service metrics pushed by AWS: ALB (RequestCount, TargetResponseTime, HTTPCode_ELB_5XX_Count, HTTPCode_Target_5XX_Count, UnHealthyHostCount), ECS (CPUUtilization, MemoryUtilization per service), Lambda (Invocations, Errors, Throttles, Duration, ConcurrentExecutions), RDS (CPUUtilization, FreeStorageSpace, DatabaseConnections, ReplicaLag), API Gateway (Count, 4XXError, 5XXError, Latency), SQS (ApproximateNumberOfMessagesVisible, ApproximateAgeOfOldestMessage), NAT Gateway (ErrorPortAllocation, PacketsDropCount, BytesOutToDestination), DynamoDB (ConsumedRead/WriteCapacityUnits, ThrottledRequests, SystemErrors).",
      "Log events: ECS container stdout/stderr via the awslogs driver (using the task execution role), Lambda function logs automatically, EC2 system/application logs via the CloudWatch agent, RDS engine logs, API Gateway execution/access logs, VPC Flow Logs.",
      "Custom metrics from application code via PutMetricData or the Embedded Metric Format (logged JSON that becomes metrics), and Container Insights performance events from ECS.",
      "Synthetics canary results and X-Ray trace summaries (ServiceLens), plus alarm state changes from other alarms feeding composite alarms."
    ],
    out: [
      "Alarm notifications to SNS topics (email, SMS, PagerDuty/Slack via HTTPS or Lambda subscriptions) and to Auto Scaling policies that scale ECS services or EC2 groups.",
      "Alarm state-change and scheduled events to EventBridge for automated remediation (e.g. Lambda restarts a stuck task).",
      "Log data via subscription filters to Lambda, Kinesis Data Streams, or Firehose (→ S3/OpenSearch), and log exports to S3 for archival.",
      "Dashboards, Logs Insights query results, and metric data served to the console, Grafana, or the GetMetricData API."
    ]
  },
  networking: [
    "Publishers need outbound HTTPS (443) to logs.<region>.amazonaws.com and monitoring.<region>.amazonaws.com; from private subnets this means the NAT Gateway or interface endpoints.",
    "Recommended for high log volume: interface VPC endpoints for logs and monitoring with private DNS enabled, so the SDK hostnames resolve to private IPs and NAT charges disappear.",
    "The ECS awslogs driver sends logs from the task's ENI using the task execution role; the Fargate task's security group therefore needs outbound 443 or the task fails to start when the log group is unreachable.",
    "Lambda functions attached to the VPC lose direct internet access and need NAT or the logs interface endpoint to deliver their own logs; functions not in a VPC publish directly.",
    "The CloudWatch agent on EC2 uses the same endpoints; SSM (used to install/configure the agent) needs its own endpoints or NAT as well."
  ],
  security: {
    iam: "Publishing requires logs:CreateLogStream, logs:PutLogEvents (and logs:CreateLogGroup if auto-creating) and cloudwatch:PutMetricData; reading dashboards, alarms, and Logs Insights requires cloudwatch:Get*/Describe* and logs:StartQuery/GetQueryResults. Scope log permissions to log-group ARNs.",
    securityGroups: "Not applicable to CloudWatch itself; publishers' security groups need outbound 443, and interface endpoints (if used) need a security group allowing 443 from the application tier.",
    nacl: "Application subnet NACLs must allow outbound 443 and inbound ephemeral ports; nothing to configure on the CloudWatch side.",
    encryption: "Log groups are encrypted at rest by default with CloudWatch-managed keys; associate a customer managed KMS key with a log group (the key policy must allow the logs.<region>.amazonaws.com service principal) for regulated data. Metrics are encrypted at rest by AWS; all API traffic is TLS. Logs data protection policies can mask credit card numbers and PII in log events.",
    authentication: "All calls are SigV4-signed with the credentials of the ECS task execution role, Lambda execution role, or EC2 instance profile; SNS subscriptions for alarms must be confirmed by the recipient.",
    authorization: "Use IAM to separate publishers (PutLogEvents/PutMetricData only) from readers (dashboards, Insights) and from administrators (PutMetricAlarm, DeleteLogGroup). Resource-based policies on log groups allow other AWS services (Route 53, EventBridge) to write to them.",
    secrets: "CloudWatch stores no secrets, but logs frequently leak them: never log tokens, passwords, or full card numbers; enable data protection policies and audit findings on sensitive log groups.",
    leastPrivilege: "Grant logs:PutLogEvents on arn:aws:logs:<region>:<account>:log-group:/ecs/shop-api:* rather than on *, and cloudwatch:PutMetricData with a cloudwatch:namespace condition so a service can only write its own namespace."
  },
  iam: [
    "ECS task execution role: logs:CreateLogStream and logs:PutLogEvents on the task's log group (included in the AmazonECSTaskExecutionRolePolicy managed policy); add logs:CreateLogGroup if you set awslogs-create-group.",
    "Lambda execution role: AWSLambdaBasicExecutionRole (logs:CreateLogGroup, CreateLogStream, PutLogEvents); add AWSXRayDaemonWriteAccess when active tracing is on.",
    "EC2 instance role for the CloudWatch agent: CloudWatchAgentServerPolicy (PutMetricData, PutLogEvents, DescribeTags) and AmazonSSMManagedInstanceCore if configuration is stored in SSM Parameter Store.",
    "Application task roles publishing custom metrics: cloudwatch:PutMetricData restricted with a cloudwatch:namespace condition (e.g. Shop/Checkout).",
    "Operators/CI: cloudwatch:PutMetricAlarm, PutDashboard, PutCompositeAlarm, logs:PutRetentionPolicy, logs:StartQuery; Auto Scaling needs no extra grant because CloudWatch invokes Application Auto Scaling through the alarm action ARN."
  ],
  scaling: [
    "Fully managed and serverless: metric ingestion, log ingestion, and alarm evaluation scale automatically with no capacity to provision.",
    "Log ingestion is subject to per-account/per-Region API quotas (PutLogEvents requests per second per log stream); the awslogs driver and agent batch events, and spreading across log streams (one per task) avoids throttling.",
    "PutMetricData has request quotas; publish many values per call, use StatisticSets or the Embedded Metric Format, and keep dimension cardinality bounded (each unique dimension combination is a billable metric).",
    "Alarms evaluate every period independently of how many you have; composite alarms fan many signals into one page.",
    "Metric data older than 15 months is dropped and high-resolution data is aggregated over time (1 s → 60 s after 3 hours, then 5 min, then 1 h)."
  ],
  availability: [
    "CloudWatch is a regional, multi-AZ AWS-managed service with no single-AZ failure mode you need to design for; metrics and logs are stored redundantly by AWS.",
    "Alarms enter INSUFFICIENT_DATA when a metric stops arriving; the treat-missing-data setting (missing, ignore, breaching, notBreaching) decides whether silence counts as a failure, which matters for 'is my job running' alarms.",
    "Cross-account observability and cross-Region dashboards let one monitoring account view multiple workload accounts and Regions.",
    "Subscription filters can stream logs to a second store (S3 via Firehose, OpenSearch) so an audit trail survives log-group deletion or retention expiry.",
    "SNS delivery of alarm notifications has its own retries; use at least two channels (email + PagerDuty/Slack) so a single failed subscription does not swallow a page."
  ],
  cost: [
    "Logs: ingestion per GB is the largest line item (about ten times the monthly storage price per GB), plus storage per GB-month for retained data and per-GB scanned by Logs Insights queries.",
    "Custom metrics per metric per month (high dimension cardinality multiplies this); AWS service metrics at standard resolution are free, EC2 detailed monitoring and Container Insights are billed as custom metrics.",
    "Alarms per alarm-month (standard resolution cheapest; high-resolution, metric-math, and composite alarms cost more); a few dozen alarms is inexpensive, thousands are not.",
    "Dashboards per dashboard-month beyond the free allowance, Synthetics per canary run, Contributor Insights per rule, and GetMetricData API calls from external dashboards such as Grafana.",
    "Data transfer: NAT Gateway per-GB charges for logs sent from private subnets unless interface endpoints (hourly + per GB) are cheaper for your volume."
  ],
  commonMistakes: [
    "Leaving log group retention at 'Never expire' so debug logs from every deploy accumulate forever and dominate the bill.",
    "Running production with no alarms at all, or with alarms that have no SNS subscription (or an unconfirmed one), so nobody is told when they fire.",
    "Alarming on a single data point of a noisy metric and paging on every blip, or setting treat-missing-data so that a quiet night at 3 a.m. looks like an outage.",
    "Logging unstructured text with secrets and PII, making Insights queries hard and creating a compliance problem.",
    "Creating unbounded custom metric dimensions (userId, requestId) and getting a surprise bill for millions of metrics.",
    "Forgetting that a Lambda in a VPC without NAT or a logs endpoint cannot deliver its own logs, then debugging 'silent' functions.",
    "Never testing an alarm end-to-end (set the threshold to trigger deliberately) and discovering the on-call rotation is misconfigured during a real incident."
  ],
  bestPractices: [
    "Set retention on every log group (for example 30 days for application logs, 1 year for audit) and export long-term logs to S3.",
    "Log structured JSON with request IDs and use the Embedded Metric Format for business metrics (orders placed, checkout failures) instead of separate PutMetricData calls.",
    "Alarm on symptoms customers feel first: ALB 5xx rate and TargetResponseTime p99, API Gateway 5XXError, Lambda Errors/Throttles, SQS ApproximateAgeOfOldestMessage, RDS FreeStorageSpace/CPU, DynamoDB ThrottledRequests, NAT ErrorPortAllocation; use M-of-N datapoints and composite alarms to cut noise.",
    "Route alarm actions to an SNS topic with at least two subscriptions (paging tool + email) and send OK actions too; use separate topics for page-worthy and informational alarms.",
    "Drive ECS auto scaling with target tracking (CPU or ALB RequestCountPerTarget) and SQS workers with queue-depth step scaling; let Auto Scaling manage those alarms.",
    "Enable Container Insights on the ECS cluster and X-Ray active tracing on Lambda/ECS so latency can be traced to a service, then build one dashboard per customer journey (browse, cart, checkout).",
    "Use interface endpoints or right-size NAT for log volume, apply data protection policies to sensitive log groups, and test every alarm by forcing it into ALARM at least once."
  ],
  creationSteps: [
    "Open the AWS Console and go to CloudWatch → Logs → Log groups → Create log group; name it /ecs/shop-api and set Retention to 30 days (optionally choose a KMS key).",
    "In the ECS task definition set the container's Log configuration to awslogs with awslogs-group=/ecs/shop-api, awslogs-region=<region>, awslogs-stream-prefix=api; confirm the task execution role has logs:CreateLogStream/PutLogEvents. Lambda functions log automatically to /aws/lambda/<function-name>.",
    "Go to Amazon SNS → Topics → Create topic (Standard) named shop-alerts, then Create subscription (Email or HTTPS to your paging tool) and confirm the subscription.",
    "Go to CloudWatch → Alarms → All alarms → Create alarm → Select metric → ApplicationELB → Per AppELB Metrics → HTTPCode_ELB_5XX_Count for your load balancer.",
    "Set Statistic = Sum, Period = 1 minute; under Conditions choose Static, Greater than a threshold (e.g. 25), Datapoints to alarm 3 out of 3, and Treat missing data as 'notBreaching'.",
    "Under Notification choose In alarm → Send to shop-alerts; add another notification for OK; click Next, name the alarm shop-alb-5xx, and Create alarm.",
    "Repeat for TargetResponseTime (p99 > 1 s), UnHealthyHostCount ≥ 1, RDS FreeStorageSpace, SQS ApproximateAgeOfOldestMessage, Lambda Errors, and DynamoDB ThrottledRequests; combine related ones into a Composite alarm under Alarms → Create composite alarm.",
    "For ECS scaling, open ECS → Cluster → Service → Update → Service auto scaling and add a Target tracking policy (ECSServiceAverageCPUUtilization = 60%); ECS creates and manages the CloudWatch alarms for you.",
    "Enable Container Insights: ECS → Cluster → Update cluster → Monitoring → Use Container Insights (or set it as the account default under ECS → Account settings).",
    "For EC2 instances, attach an instance role with CloudWatchAgentServerPolicy, install the CloudWatch agent via SSM Run Command (AWS-ConfigureAWSPackage → AmazonCloudWatchAgent), and store the agent config in SSM Parameter Store.",
    "Create a dashboard: CloudWatch → Dashboards → Create dashboard → add widgets for ALB requests/5xx/latency, ECS CPU/memory, RDS connections/storage, SQS depth, Lambda errors, DynamoDB throttles.",
    "Optionally create a Synthetics canary (CloudWatch → Application Signals → Synthetics Canaries → Create canary → Heartbeat monitoring) that hits the storefront URL every 5 minutes and alarms on SuccessPercent < 100."
  ],
  productionRecommendations: [
    "Retention set on every log group; structured JSON logs; no secrets or PII in logs (data protection policies on).",
    "Alarms on customer-facing symptoms (ALB/API Gateway 5xx and latency, Lambda errors, SQS age, RDS storage/CPU, DynamoDB throttles) with M-of-N evaluation and composite alarms.",
    "Every alarm has ALARM and OK actions to an SNS topic with at least two confirmed subscriptions; alarms tested by forcing them.",
    "Auto Scaling driven by target-tracking alarms for ECS services and queue-depth for workers.",
    "Container Insights and X-Ray enabled; one dashboard per customer journey plus a platform dashboard.",
    "Interface endpoints for logs/monitoring or right-sized NAT; log exports to S3 for long-term audit."
  ],
  configExample: {
    title: "Terraform — ALB 5xx alarm to SNS, and an ECS log group with retention",
    lang: "hcl",
    code: `resource "aws_sns_topic" "alerts" { name = "shop-alerts" }   # subscribe email / PagerDuty

# Page when the ALB itself returns 5xx (no healthy targets, timeouts) 3 minutes in a row
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "shop-alb-5xx"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  dimensions          = { LoadBalancer = aws_lb.web.arn_suffix }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 3
  datapoints_to_alarm = 3
  threshold           = 25
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"   # no traffic is not an outage
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/shop-api"
  retention_in_days = 30                 # default "never expire" grows the bill forever
}

# In the ECS task definition container_definitions (JSON) — ships stdout/stderr above:
#   "logConfiguration": { "logDriver": "awslogs",
#     "options": { "awslogs-group": "/ecs/shop-api", "awslogs-region": "eu-west-1",
#                  "awslogs-stream-prefix": "api" } }
# The task EXECUTION role needs logs:CreateLogStream + logs:PutLogEvents on this group.`
  },
  productionChecklist: [
    "Every log group has an explicit retention period; sensitive groups use a KMS key and data protection policy.",
    "ECS tasks use the awslogs driver (or FireLens) and Lambda logs are flowing; no silent functions.",
    "Alarms exist for ALB 5xx and latency, UnHealthyHostCount, API Gateway 5XXError, Lambda Errors/Throttles, SQS ApproximateAgeOfOldestMessage, RDS FreeStorageSpace/CPU/connections, DynamoDB ThrottledRequests, NAT ErrorPortAllocation.",
    "Each alarm has ALARM and OK actions to an SNS topic with at least two confirmed subscriptions.",
    "Treat-missing-data and M-of-N datapoints configured deliberately per alarm; composite alarms reduce noise.",
    "Every alarm has been forced into ALARM once to verify the paging path.",
    "ECS service auto scaling policies in place and driven by CloudWatch metrics.",
    "Container Insights enabled on the cluster; X-Ray tracing on Lambda/ECS.",
    "Dashboards for the platform and key customer journeys exist and are used in incident reviews.",
    "Custom metric dimensions bounded; log volume and NAT/endpoint costs reviewed monthly."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Task execution roles, Lambda execution roles, and EC2 instance profiles need logs:PutLogEvents / cloudwatch:PutMetricData permissions." },
    { id: "sns", kind: "recommended", why: "Alarm actions notify humans and tools through SNS topics." },
    { id: "auto-scaling", kind: "recommended", why: "Alarms trigger scaling policies for ECS services and EC2 groups." },
    { id: "nat-gateway", kind: "optional", why: "Private-subnet publishers reach the public CloudWatch endpoints via NAT unless interface endpoints are used." },
    { id: "eventbridge", kind: "optional", why: "Alarm state changes and scheduled rules flow through EventBridge (formerly CloudWatch Events) for automated remediation." },
    { id: "ecs", kind: "optional", why: "Main log and metric source via the awslogs driver and Container Insights." },
    { id: "lambda", kind: "optional", why: "Logs automatically and publishes Errors/Throttles/Duration metrics." },
    { id: "alb", kind: "optional", why: "Source of the most important customer-facing metrics (5xx, latency, unhealthy hosts)." }
  ],
  related: ["sns", "auto-scaling", "eventbridge", "ecs", "lambda", "alb", "rds", "sqs"],
  ecommerceRole: "Collects metrics and logs from every tier (CloudFront/ALB/API Gateway at the edge, ECS and Lambda compute, SQS workers, RDS and DynamoDB data, the NAT Gateway) and turns them into alarms that page the team via SNS and scale ECS services via Auto Scaling. It is the platform's eyes during a flash sale or an incident.",
  failure: {
    title: "CloudWatch monitoring is missing or alarms don't fire",
    whatHappens: "The application keeps running: CloudWatch is not in the request path, so users notice nothing. The danger is that the team notices nothing either. If log delivery breaks (missing IAM permission, no NAT or endpoint from a private subnet), ECS tasks may fail to start or Lambda functions run 'silently' with no logs. If an alarm has no confirmed SNS subscription, a wrong threshold, or a metric that stopped arriving, it sits in OK or INSUFFICIENT_DATA while the ALB returns 5xx and the checkout queue ages; you learn about the outage from customers or a social-media post. During a rare CloudWatch service event, alarm evaluation and Auto Scaling driven by alarms can be delayed, so services may not scale out in time.",
    awsMechanisms: [
      "Alarm states OK / ALARM / INSUFFICIENT_DATA and the treat-missing-data setting (missing, ignore, breaching, notBreaching) define what happens when data stops; 'breaching' makes silence itself page you.",
      "Composite alarms and M-of-N evaluation keep signal despite individual noisy or missing metrics.",
      "SNS retries deliveries and supports multiple subscriptions per topic; alarm history records each state change.",
      "CloudWatch is regional and multi-AZ; AWS-published service metrics continue to arrive even when your own publishers are broken.",
      "ECS surfaces awslogs delivery failures as task stop reasons; the CloudWatch agent and awslogs driver buffer and retry transient endpoint errors."
    ],
    mitigations: [
      "Create a 'heartbeat' alarm on a metric that must always exist (e.g. ALB RequestCount or a canary SuccessPercent) with treat-missing-data = breaching so the absence of data is detected.",
      "Force every alarm into ALARM once after creation (aws cloudwatch set-alarm-state) to verify the full SNS → paging path, and confirm subscriptions.",
      "Alarm on the monitoring itself: Synthetics canaries from outside the platform, and an AWS Health / EventBridge rule for CloudWatch service events.",
      "Give every publisher a working network path (interface endpoints or NAT) and the exact IAM permissions; watch for tasks stopping with 'CannotStartContainerError' referencing awslogs.",
      "Use target tracking for ECS so scaling depends on managed alarms, and set sensible minimum task counts so a delayed alarm does not mean zero capacity."
    ]
  },
  beginnerConnectionHint: "Every other service in the picture sends its numbers and logs to CloudWatch; CloudWatch talks to SNS to alert people and to Auto Scaling to add or remove servers."
});
