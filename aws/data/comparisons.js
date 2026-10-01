/* Side-by-side comparisons for commonly confused services. */
window.AWS_COMPARISONS = [
  { id: "ec2-ecs-lambda", title: "EC2 vs ECS vs Lambda", items: ["ec2", "ecs", "lambda"],
    beginner: "EC2 = you rent a whole computer. ECS = you hand AWS boxes (containers) and it runs them on computers for you. Lambda = you hand AWS a tiny recipe and it runs it only when someone asks, then puts it away.",
    rows: [
      ["Best use case", "Legacy apps, custom OS/kernel needs, GPU/HPC, long-lived stateful servers", "Containerised web APIs and workers with steady traffic; teams already using Docker", "Event handlers, glue code, spiky or infrequent workloads, APIs with low steady load"],
      ["Control", "Full: OS, patches, agents, networking stack", "Container image + task definition; on Fargate no host access", "Code + runtime config only; no OS, no host"],
      ["Scaling", "Auto Scaling Group adds/removes instances (minutes)", "Service Auto Scaling changes task count (tens of seconds to minutes on Fargate)", "Automatic per request up to account concurrency (milliseconds to seconds)"],
      ["Startup time", "Minutes (boot + user data)", "Seconds to ~1 minute (image pull + container start)", "Milliseconds warm; cold starts ~100 ms–seconds depending on runtime/VPC"],
      ["Operational overhead", "High: patching, hardening, capacity", "Medium (EC2 launch type) / Low (Fargate)", "Lowest: AWS manages everything below the code"],
      ["Cost model", "Per instance-hour whether busy or idle (Savings Plans/Spot reduce)", "Fargate: per vCPU-second + GB-second per task; EC2 launch type: instance cost", "Per request + GB-second of execution; free when idle"],
      ["Max runtime", "Unlimited", "Unlimited", "15 minutes per invocation"],
      ["Example in the shop", "Optional: legacy inventory service on an ASG", "Main API and SQS worker services", "OrderPlaced → analytics writer; image thumbnails; API Gateway endpoints"]
    ],
    verdict: "Default to ECS on Fargate for the main API; use Lambda for event-driven and spiky work; use EC2 only when you need the OS." },

  { id: "alb-nlb", title: "ALB vs NLB", items: ["alb", "nlb"],
    beginner: "ALB is a receptionist who reads your request ('I want /orders') and sends you to the right desk. NLB is a fast traffic cop who just waves cars through by lane number without reading anything.",
    rows: [
      ["OSI layer", "Layer 7 (HTTP/HTTPS, gRPC, WebSocket)", "Layer 4 (TCP, UDP, TLS)"],
      ["Routing", "Host, path, header, query string, HTTP method; weighted target groups", "Port/protocol only; flow hashing"],
      ["Targets", "IP, instance, Lambda", "IP, instance, ALB"],
      ["Static IP", "No (DNS name; IPs change) — put an NLB in front if you need one", "Yes: one static/Elastic IP per AZ"],
      ["Source IP", "Replaced; original in X-Forwarded-For", "Preserved (client IP visible to target)"],
      ["Latency", "Low (adds L7 processing)", "Ultra-low, millions of requests/sec"],
      ["TLS", "Terminates TLS with ACM; can re-encrypt to targets", "TLS termination or passthrough"],
      ["Best for", "Web apps and REST/gRPC APIs — the e-commerce API", "Non-HTTP protocols, allow-listed static IPs, PrivateLink endpoint services, extreme throughput"]
    ],
    verdict: "Use ALB for HTTP APIs (this architecture). Use NLB when you need static IPs, non-HTTP protocols, or PrivateLink." },

  { id: "sqs-sns", title: "SQS vs SNS", items: ["sqs", "sns"],
    beginner: "SQS is a to-do box: you drop a slip in, one worker picks it up later. SNS is a bell: you ring it once and everyone who signed up hears it right away.",
    rows: [
      ["Pattern", "Queue: point-to-point, pull-based", "Topic: publish/subscribe, push-based"],
      ["Consumers", "One consumer group processes each message (competing consumers)", "Every subscriber gets every (filtered) message"],
      ["Persistence", "Messages stored up to 14 days until deleted", "No storage: delivered immediately or retried per subscriber policy"],
      ["Delivery", "At-least-once (Standard) / exactly-once processing (FIFO)", "At-least-once to each endpoint; FIFO topics available"],
      ["Retries", "Visibility timeout + DLQ after maxReceiveCount", "Delivery retry policy per protocol; DLQ per subscription"],
      ["Rate control", "Consumers pull at their own pace — natural buffer", "Pushes as fast as publishers publish"],
      ["Typical shop use", "Background jobs: send invoice, resize image, sync inventory", "OrderConfirmed notifications to email/SMS and to several queues"],
      ["Together", "SNS → multiple SQS queues = durable fan-out", "—"]
    ],
    verdict: "Need one worker to eventually do a job? SQS. Need many systems told at once? SNS (often fanning out into SQS queues)." },

  { id: "sns-eventbridge", title: "SNS vs EventBridge", items: ["sns", "eventbridge"],
    beginner: "SNS is a bell everyone hears. EventBridge is a smart mail sorter: it reads each letter and delivers it only to the people whose rules say 'I want letters like this'.",
    rows: [
      ["Model", "Topic with subscriptions; filtering on message attributes", "Event bus with rules matching on the JSON event body"],
      ["Filtering", "Attribute-based filter policies (payload filtering also supported)", "Rich content-based patterns on any field (prefix, numeric, anything-but…)"],
      ["Targets", "SQS, Lambda, HTTP/S, email, SMS, mobile push, Kinesis Firehose", "20+ AWS services, SaaS partners, API destinations (HTTP), other buses/accounts"],
      ["Throughput / latency", "Very high throughput, low latency", "Lower throughput limits, latency typically ~0.5 s; fine for business events"],
      ["Schema & replay", "None", "Schema registry, archive & replay of past events"],
      ["Scheduling", "No", "Yes (Scheduler / scheduled rules)"],
      ["AWS service events", "No", "Yes: ECS task state changes, S3 object created, etc."],
      ["Typical shop use", "Customer notifications, alarm paging", "Business events (OrderPlaced) routed to Lambda, Step Functions, SQS"]
    ],
    verdict: "Human-facing notifications and simple fan-out → SNS. Application/business events with routing rules → EventBridge." },

  { id: "rds-dynamodb", title: "RDS vs DynamoDB", items: ["rds", "dynamodb"],
    beginner: "RDS is a big organised filing cabinet with cross-referenced folders (joins). DynamoDB is a giant wall of labelled sticky notes: find one instantly by its label, but don't ask it to cross-reference everything.",
    rows: [
      ["Data model", "Relational tables, joins, constraints, SQL", "Key/value + documents; access by partition key (and sort key); no joins"],
      ["Schema", "Fixed schema, migrations", "Schemaless items; design table around access patterns"],
      ["Scaling", "Vertical + read replicas; single writer", "Horizontal, automatic; on-demand or provisioned capacity"],
      ["Consistency", "ACID transactions across tables", "Strongly or eventually consistent reads; transactions across up to 100 items"],
      ["Latency", "Milliseconds, varies with query complexity", "Single-digit ms at any scale; microseconds with DAX"],
      ["Placement", "Inside your VPC (private DB subnets, SG)", "Outside your VPC; IAM authorization; gateway endpoint"],
      ["Ops", "Managed but you tune indexes, connections, instance size", "Serverless; you tune keys, GSIs, and capacity mode"],
      ["Typical shop use", "Orders, payments, customers, inventory (system of record)", "Carts, sessions, product view counters, feature flags"]
    ],
    verdict: "Money and relationships → RDS. High-volume, simple-key access at scale → DynamoDB. Most real systems use both." },

  { id: "ecs-lambda", title: "ECS vs Lambda", items: ["ecs", "lambda"],
    beginner: "ECS keeps workers on duty all day in case someone comes. Lambda calls a worker in only when a customer arrives and sends them home the moment they finish.",
    rows: [
      ["Runtime model", "Long-running containers; you handle the HTTP server", "Function invoked per event; AWS handles the server"],
      ["Idle cost", "You pay for running tasks even at zero traffic (min count)", "Zero when idle"],
      ["Steady high traffic cost", "Cheaper per request at sustained load", "Per-request billing gets expensive at constant high volume"],
      ["Cold start", "None once tasks are warm; new tasks take seconds", "Yes; mitigated by provisioned concurrency (extra cost)"],
      ["Execution limit", "None", "15 minutes, 10 GB memory, 6 MB sync payload"],
      ["VPC", "Always in your VPC subnets", "Outside by default; optional VPC attachment (then needs NAT/endpoints)"],
      ["Connection pooling to RDS", "Easy: long-lived pool per task", "Hard: use RDS Proxy"],
      ["Best for", "Main API, WebSocket servers, queue workers with steady load", "Event handlers, cron jobs, spiky APIs, glue between services"]
    ],
    verdict: "Steady request volume or long-lived connections → ECS. Bursty, event-driven, short tasks → Lambda." },

  { id: "cloudfront-api-gateway", title: "CloudFront vs API Gateway", items: ["cloudfront", "api-gateway"],
    beginner: "CloudFront is a network of helpers near every city that hand out copies of your pages fast. API Gateway is a smart front door that checks tickets, counts visitors, and calls the right robot.",
    rows: [
      ["Purpose", "Global CDN: caching, TLS at edge, DDoS absorption, routing to origins", "Managed API front door: auth, throttling, request mapping, Lambda integration"],
      ["Scope", "Global edge network", "Regional (or edge-optimized REST, which itself uses CloudFront)"],
      ["Caching", "Core feature; per-behavior TTLs, cache keys", "Optional stage cache (REST APIs only)"],
      ["Auth", "Signed URLs/cookies; WAF; Lambda@Edge/Functions for custom logic", "Cognito/JWT/Lambda authorizers, IAM auth, API keys & usage plans"],
      ["Backends", "S3, ALB, API Gateway, any HTTP origin", "Lambda, HTTP endpoints, AWS services, private ALB/NLB via VPC Link"],
      ["Cost", "Per GB transferred + per request (cheap at scale)", "Per million requests (HTTP API cheaper than REST) + data transfer"],
      ["In this architecture", "Fronts S3 (static site) and ALB (/api/*)", "Alternative entry to a few serverless endpoints (→ Lambda)"],
      ["Together?", "CloudFront in front of API Gateway is common for custom domains + WAF + caching", "—"]
    ],
    verdict: "They are different layers: CloudFront is delivery/caching; API Gateway is API management. Use CloudFront always; add API Gateway when you have Lambda-backed APIs." },

  { id: "nat-igw", title: "NAT Gateway vs Internet Gateway", items: ["nat-gateway", "igw"],
    beginner: "The Internet Gateway is the building's front gate: people can walk in and out. The NAT Gateway is a back door that only opens from the inside: workers can go out to fetch things, but strangers can't come in through it.",
    rows: [
      ["Direction", "Two-way: inbound and outbound for resources with public IPs", "Outbound-initiated only; return traffic allowed, inbound connections impossible"],
      ["Who uses it", "Public subnets: ALB, NAT Gateway, bastion", "Private subnets: ECS tasks, EC2, VPC-attached Lambda"],
      ["Public IP needed?", "Yes, on the resource (or ENI)", "No — the NAT's Elastic IP is used as the source"],
      ["Placement", "Attached to the VPC (one per VPC)", "Inside a public subnet (one per AZ recommended)"],
      ["Route", "Public RT: 0.0.0.0/0 → igw-…", "Private RT: 0.0.0.0/0 → nat-…; NAT itself relies on the public RT → IGW"],
      ["Availability", "Highly available and horizontally scaled by AWS", "AZ-scoped; deploy one per AZ"],
      ["Cost", "Free (data transfer charges apply)", "Hourly + per GB processed — avoid with VPC endpoints for AWS services"],
      ["Depends on the other?", "No", "Yes: NAT needs an IGW to reach the internet"]
    ],
    verdict: "IGW makes a VPC internet-capable; NAT lets private resources use that capability without being exposed." },

  { id: "sg-nacl", title: "Security Group vs NACL", items: ["security-groups", "nacl"],
    beginner: "A security group is a bodyguard standing next to each worker who remembers who was let in, so replies can come back automatically. A NACL is a guard at the room's door who checks every single person in both directions and forgets them immediately.",
    rows: [
      ["Level", "Instance / ENI (task, instance, ALB node, RDS endpoint)", "Subnet boundary"],
      ["State", "Stateful: return traffic automatically allowed", "Stateless: must allow ephemeral ports (1024–65535) for replies"],
      ["Rule types", "Allow only (implicit deny)", "Allow and Deny, numbered, evaluated in order, first match wins"],
      ["Sources", "CIDR, prefix list, or another security group", "CIDR only"],
      ["Default", "New SG: deny all inbound, allow all outbound", "Default NACL: allow all both ways"],
      ["Scale", "Up to 5 per ENI; rule quota per SG", "One NACL per subnet; a NACL can cover many subnets"],
      ["Best for", "Primary control: least-privilege chain ALB → ECS → RDS", "Coarse guard: block a hostile CIDR, restrict DB subnet to app subnet range"],
      ["Evaluation order", "Applied after NACL (packet reaches the ENI)", "Applied first at the subnet edge"]
    ],
    verdict: "Use security groups as the primary control (reference other SGs). Use NACLs sparingly for subnet-wide denies." }
];
