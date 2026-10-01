/* Database services — Amazon RDS (golden template for the schema in _schema.md) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "rds",
  name: "Amazon RDS",
  shortName: "RDS",
  fullName: "Amazon Relational Database Service",
  category: "database",
  icon: "🗄️",
  tagline: "Managed relational database engines (PostgreSQL, MySQL, MariaDB, Oracle, SQL Server)",
  whatIsIt: "Amazon RDS runs a relational database engine such as PostgreSQL or MySQL on AWS-managed instances. AWS handles provisioning, patching, automated backups, and optional Multi-AZ failover, while you keep full SQL access and own the schema, queries, and data model.",
  eli5: "RDS is like a very organized cupboard where your shop keeps its important lists: customers, orders, and what each order contains. Instead of you building the cupboard, fixing its hinges, and making copies in case it breaks, AWS does that boring work. You just open the drawers and read or write the lists.",
  technical: "RDS provisions an EC2-backed database instance inside your VPC subnets (via a DB subnet group), exposes a DNS endpoint on the engine port (5432 PostgreSQL, 3306 MySQL), and manages OS/engine patching, automated snapshots, point-in-time recovery, and synchronous Multi-AZ replication with automatic DNS failover. Read replicas use asynchronous replication for read scaling.",
  whyUse: [
    "You need ACID transactions, joins, and constraints for relational data such as orders and payments.",
    "You do not want to operate database servers: patching, backups, and failover are automated.",
    "Point-in-time recovery and automated snapshots protect against bad deploys and accidental deletes.",
    "Multi-AZ gives a standby in another Availability Zone with automatic failover and no application-side changes beyond reconnecting."
  ],
  whenToUse: [
    "Order, payment, inventory, and customer data where correctness and transactions matter more than raw write throughput.",
    "Applications already written against PostgreSQL/MySQL that you are lifting into AWS.",
    "Reporting queries with joins and aggregations across several tables.",
    "Teams that need a familiar SQL model and mature tooling (ORMs, migrations, BI tools)."
  ],
  whenNotToUse: [
    "Massive key/value or single-table access patterns at very high write rates: DynamoDB scales horizontally without capacity planning.",
    "Session caches or hot counters: use an in-memory cache (ElastiCache) instead of hammering the database.",
    "Storing files, images, or large blobs: put objects in S3 and store only the S3 key in RDS.",
    "Unbounded event/log firehoses: stream them to S3 or a purpose-built analytics store instead of a relational table.",
    "You need to tune the OS or install custom database extensions AWS does not support: self-manage on EC2 instead."
  ],
  placement: {
    scope: "vpc",
    subnet: "private-db",
    internetAccessible: false,
    summary: "RDS instances live inside your VPC in private database subnets (one per AZ) selected via a DB subnet group. In production the instance is not publicly accessible; only the application tier inside the VPC can reach its endpoint.",
    securityGroup: "Attach a dedicated RDS security group that allows inbound 5432 (or 3306) only from the application security group (ECS tasks, EC2, Lambda) — never from 0.0.0.0/0.",
    nacl: "The database subnet NACL can be tightened to allow inbound only from the application subnet CIDRs on the engine port and ephemeral return traffic outbound. Many teams leave the default allow-all NACL and rely on security groups.",
    routeTable: "The database route table needs only the VPC local route (10.0.0.0/16 → local). It has no 0.0.0.0/0 route at all; databases do not need internet access.",
    nat: "Not required. RDS performs its own patching and backups through AWS-internal channels; it does not use your NAT Gateway.",
    igw: "Not required. Setting 'Publicly accessible = Yes' would place a public IP on the endpoint and require an IGW route — avoid this in production."
  },
  dataFlow: {
    in: [
      "SQL queries (SELECT/INSERT/UPDATE/DELETE) from ECS tasks, EC2 instances, or Lambda functions over TCP.",
      "Schema migrations run from CI/CD or a bastion/ECS one-off task.",
      "Credentials retrieved by the application from Secrets Manager (not stored in RDS itself)."
    ],
    out: [
      "Query result sets returned to the application tier.",
      "Automated snapshots and transaction logs shipped to AWS-managed S3 storage for backups and point-in-time recovery.",
      "Metrics (CPUUtilization, FreeStorageSpace, DatabaseConnections) and engine logs to CloudWatch.",
      "Replication stream to the Multi-AZ standby (synchronous) and to read replicas (asynchronous)."
    ]
  },
  networking: [
    "Create a DB subnet group containing at least two private subnets in different AZs.",
    "Expose only the engine port (5432 PostgreSQL / 3306 MySQL) from the application security group.",
    "The application connects to the RDS DNS endpoint, never to an IP — the endpoint moves during failover.",
    "Keep 'Publicly accessible' set to No; use a bastion host, SSM Session Manager port-forwarding, or a VPN for admin access.",
    "No NAT or Internet Gateway route is required in the database subnets."
  ],
  security: {
    iam: "IAM controls who can create, modify, snapshot, or delete the instance (rds:* actions). Optionally enable IAM database authentication so applications get short-lived tokens instead of passwords.",
    securityGroups: "RDS security group allows inbound only from the application security group on the engine port. Referencing a security group (not a CIDR) means new tasks are automatically allowed and nothing else is.",
    nacl: "Optionally restrict the database subnet NACL to the application subnet CIDRs on the engine port plus ephemeral ports (1024–65535) for return traffic.",
    encryption: "Enable encryption at rest with a KMS key at creation time (it cannot be enabled later without a snapshot copy). Enforce TLS in transit (rds.force_ssl=1 on PostgreSQL) so clients cannot connect in plaintext.",
    authentication: "Master credentials stored in AWS Secrets Manager with automatic rotation, or IAM database authentication for token-based login.",
    authorization: "Use database-level roles: the application gets a role limited to its schema; migrations use a separate role; nobody uses the master user at runtime.",
    secrets: "Never bake passwords into task definitions or environment files. Inject them at runtime from Secrets Manager via the ECS task execution role or Lambda's environment decryption.",
    leastPrivilege: "Application IAM roles need no RDS permissions at all to run SQL — only network access. Keep rds:* administrative permissions for the deployment pipeline and operators."
  },
  iam: [
    "Operators/CI pipeline: rds:CreateDBInstance, rds:ModifyDBInstance, rds:CreateDBSnapshot, rds:DeleteDBInstance (scoped to specific ARNs and tagged resources).",
    "Application task/execution roles: secretsmanager:GetSecretValue for the DB secret; no rds:* permissions are needed for plain SQL connections.",
    "If using IAM database authentication: rds-db:connect on the specific dbuser resource ARN.",
    "RDS needs a monitoring role (AmazonRDSEnhancedMonitoringRole) to publish Enhanced Monitoring metrics to CloudWatch Logs.",
    "KMS key policy must allow the RDS service and your operators to use the key for encrypted storage and snapshots."
  ],
  scaling: [
    "Vertical: change the instance class (e.g. db.r6g.large → db.r6g.xlarge); this causes a short interruption unless Multi-AZ, where the standby is resized first.",
    "Storage autoscaling grows the disk automatically up to a maximum you set.",
    "Read scaling: add up to 15 read replicas (asynchronous) and route read-only queries to them.",
    "Connection scaling: put RDS Proxy in front to pool connections from many ECS tasks or Lambda invocations.",
    "Write scaling is limited to one primary; shard or move hot key/value data to DynamoDB if a single writer becomes the bottleneck."
  ],
  availability: [
    "Multi-AZ instance deployment keeps a synchronous standby in a second AZ; failover updates the DNS endpoint in roughly 60–120 seconds.",
    "Multi-AZ DB cluster (PostgreSQL/MySQL) adds two readable standbys with faster failover.",
    "Automated backups (1–35 days retention) enable point-in-time recovery to any second within the window.",
    "Manual snapshots persist beyond retention and can be copied to another Region for disaster recovery.",
    "Cross-Region read replicas provide a warm standby for regional DR; promote the replica to become a primary."
  ],
  cost: [
    "Instance hours: the instance class and engine you choose is the biggest driver; Multi-AZ roughly doubles it because the standby is a full instance.",
    "Storage (GB-month) and provisioned IOPS if you choose io1/io2 instead of gp3.",
    "Backup storage beyond the free amount equal to your DB size, and snapshot copies to other Regions.",
    "Data transfer: cross-AZ traffic between the application and database is charged per GB; same-AZ is free.",
    "Read replicas and RDS Proxy are billed as additional instances/capacity."
  ],
  commonMistakes: [
    "Setting 'Publicly accessible = Yes' and opening the security group to 0.0.0.0/0 for convenience.",
    "Running a single-AZ instance in production and discovering it during an AZ event or a maintenance reboot.",
    "Forgetting to enable encryption at creation; enabling it later requires a snapshot-copy-restore migration.",
    "Hard-coding the master password in code, task definitions, or .env files committed to git.",
    "Connecting to the instance IP instead of the DNS endpoint, which breaks after failover.",
    "Opening hundreds of connections from Lambda without RDS Proxy and exhausting max_connections.",
    "Never testing a restore; backups that have never been restored are hope, not a plan.",
    "Using the master user as the application's runtime user."
  ],
  bestPractices: [
    "Private subnets only, dedicated security group referencing the application security group.",
    "Multi-AZ for every production database; single-AZ only for dev/test.",
    "Encryption at rest with KMS and TLS enforced in transit.",
    "Credentials in Secrets Manager with rotation; separate app and migration users.",
    "Automated backups with 7–35 days retention plus periodic cross-Region snapshot copies.",
    "CloudWatch alarms on CPUUtilization, FreeStorageSpace, FreeableMemory, DatabaseConnections, and ReplicaLag.",
    "Enable Performance Insights to find slow queries; add indexes before adding instance size.",
    "Use RDS Proxy when connecting from Lambda or a large fleet of short-lived tasks."
  ],
  creationSteps: [
    "Open the AWS Console and go to RDS → Databases → Create database.",
    "Choose 'Standard create' and select the engine (e.g. PostgreSQL) and version.",
    "Pick the 'Production' template so Multi-AZ, provisioned storage, and backups default on.",
    "Set the DB instance identifier, master username, and choose 'Manage master credentials in AWS Secrets Manager'.",
    "Select an instance class (start with a burstable/graviton class such as db.t4g.medium or db.r6g.large) and gp3 storage with autoscaling enabled.",
    "Under Connectivity choose your VPC, a DB subnet group made of the private database subnets, and set Public access = No.",
    "Choose 'Create new' VPC security group named rds-sg; after creation edit it to allow the engine port only from the application security group.",
    "Enable encryption with the default aws/rds KMS key or a customer managed key.",
    "Set backup retention (7+ days), enable Enhanced Monitoring and Performance Insights, and turn on deletion protection.",
    "Review the estimated monthly cost and click Create database; wait for status 'Available'.",
    "Copy the endpoint hostname into your application's configuration (or Secrets Manager) and connect from an ECS task or bastion to verify."
  ],
  productionRecommendations: [
    "Multi-AZ on, Publicly accessible off, deletion protection on.",
    "Encrypt storage with KMS and enforce SSL/TLS for client connections.",
    "Store and rotate credentials in Secrets Manager; grant the app role only GetSecretValue.",
    "Enable automated backups (7–35 days) and copy snapshots to a second Region.",
    "Alarm on storage, CPU, connections, and replica lag in CloudWatch.",
    "Use parameter groups (not ad-hoc changes) so configuration is reproducible."
  ],
  configExample: {
    title: "Terraform — private, encrypted, Multi-AZ PostgreSQL",
    lang: "hcl",
    code: `resource "aws_db_subnet_group" "db" {
  name       = "shop-db-subnets"
  subnet_ids = [aws_subnet.db_a.id, aws_subnet.db_b.id]   # 10.0.21.0/24, 10.0.22.0/24
}

resource "aws_db_instance" "orders" {
  identifier             = "shop-orders"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.r6g.large"
  allocated_storage      = 100
  max_allocated_storage  = 500          # storage autoscaling
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.rds.arn
  multi_az               = true
  publicly_accessible    = false
  db_subnet_group_name   = aws_db_subnet_group.db.name
  vpc_security_group_ids = [aws_security_group.rds.id] # inbound 5432 from ecs-sg only
  manage_master_user_password = true    # stored in Secrets Manager
  backup_retention_period = 14
  deletion_protection    = true
  performance_insights_enabled = true
}`
  },
  productionChecklist: [
    "Instance is in private database subnets across 2+ AZs (DB subnet group).",
    "Publicly accessible = No; no 0.0.0.0/0 route in the DB route table.",
    "Security group allows the engine port only from the application security group.",
    "Multi-AZ enabled.",
    "Storage encrypted with KMS; TLS enforced for connections.",
    "Credentials in Secrets Manager with rotation; app uses a non-master DB user.",
    "Automated backups ≥ 7 days; restore tested at least once.",
    "Deletion protection on; final snapshot on delete.",
    "CloudWatch alarms for CPU, storage, connections, replica lag.",
    "Performance Insights / Enhanced Monitoring enabled."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "RDS instances are launched into subnets of a VPC." },
    { id: "subnets", kind: "required", why: "A DB subnet group needs private subnets in at least two AZs." },
    { id: "security-groups", kind: "required", why: "Controls which application security group may reach the engine port." },
    { id: "route-tables", kind: "required", why: "The DB subnets need only the local VPC route; no internet route." },
    { id: "iam", kind: "recommended", why: "Administrative permissions, monitoring role, optional IAM database authentication." },
    { id: "cloudwatch", kind: "recommended", why: "Metrics, alarms, and engine logs." },
    { id: "nacl", kind: "optional", why: "Extra subnet-level filtering around the database tier." },
    { id: "dynamodb", kind: "alternative", why: "Use for high-volume key/value access patterns instead of forcing them into SQL." }
  ],
  related: ["dynamodb", "ecs", "lambda", "security-groups", "subnets", "s3"],
  ecommerceRole: "System of record for orders, payments, customers, and inventory — anything that needs transactions and joins. Product images are in S3 and the cart/session store is in DynamoDB; RDS holds the money-critical data.",
  failure: {
    title: "RDS primary fails",
    whatHappens: "With Multi-AZ, RDS detects the failure, promotes the synchronous standby in the other AZ, and repoints the DNS endpoint. Applications see connection errors for about 1–2 minutes and must reconnect (connection pools should retry). Without Multi-AZ, the instance is restarted or restored from backup, which can mean minutes to hours of downtime and possible data loss up to the last transaction log backup (about 5 minutes).",
    awsMechanisms: [
      "Multi-AZ synchronous standby with automatic DNS failover.",
      "Automated backups and point-in-time recovery.",
      "Read replicas that can be promoted (manual) for regional DR.",
      "RDS Proxy keeps client connections open across failover and reduces reconnect storms."
    ],
    mitigations: [
      "Enable Multi-AZ on every production instance.",
      "Application connection pools must use the DNS endpoint and retry with backoff.",
      "Keep DNS TTL short in clients (JVM DNS caching is a classic trap).",
      "Alarm on failover events via RDS event subscriptions → SNS."
    ]
  },
  beginnerConnectionHint: "The application servers (ECS tasks, EC2, or Lambda) are the only ones allowed to talk to RDS, and RDS sends its health numbers to CloudWatch."
});
