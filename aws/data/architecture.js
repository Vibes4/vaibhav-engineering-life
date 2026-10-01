/* Architecture configuration presets + rules used by the Security Review and the
   Production Readiness Score. Rules are pure functions of the settings object, so the
   "What-if" toggles in the UI re-run the same engine. */
window.AWS_ARCH = (function () {
  const SETTINGS = [
    /* key, label, group, hint */
    ["privateSubnets",        "Application and database tiers in private subnets",       "Networking",   "Only the ALB and NAT live in public subnets."],
    ["dbNoInternetRoute",     "Database route table has no 0.0.0.0/0 route",             "Networking",   "DB subnets route only 10.0.0.0/16 → local."],
    ["routeTablesCorrect",    "Public → IGW, private → NAT, one private RT per AZ",       "Networking",   "Wrong targets make a subnet accidentally public or isolated."],
    ["sgChainCorrect",        "Security groups reference each other (ALB → ECS → RDS)",  "Networking",   "ecs-sg allows 8080 from alb-sg; rds-sg allows 5432 from ecs-sg."],
    ["natPerAZ",              "One NAT Gateway per AZ",                                  "Availability", "A single NAT in AZ-A takes AZ-B's outbound traffic down with it."],
    ["natNeeded",             "Private tasks actually need outbound internet (3rd-party APIs)", "Cost", "If false and endpoints exist, NAT is unnecessary spend."],
    ["vpcEndpoints",          "Gateway endpoints for S3 + DynamoDB (and interface endpoints for ECR/logs)", "Cost", "Keeps AWS API traffic off the NAT and inside the AWS network."],
    ["rdsPublic",             "RDS 'Publicly accessible' = Yes",                          "Security",     "Puts a public IP on the database endpoint."],
    ["rdsSgOpenToWorld",      "RDS security group allows 5432 from 0.0.0.0/0",            "Security",     "Anyone on the internet can attempt to log in."],
    ["ec2Public",             "EC2 app instances have public IPs in a public subnet",      "Security",     "Instances should sit behind the ALB in private subnets."],
    ["rdsMultiAZ",            "RDS Multi-AZ enabled",                                     "Availability", "Synchronous standby in a second AZ with automatic failover."],
    ["rdsEncrypted",          "RDS storage encrypted with KMS",                           "Security",     "Must be set at creation time."],
    ["tlsInTransit",          "TLS enforced app → RDS and HTTPS everywhere",              "Security",     "rds.force_ssl, HTTPS listeners, HTTP → HTTPS redirect."],
    ["rdsBackups",            "Automated backups ≥ 7 days + tested restore",              "Availability", "Point-in-time recovery."],
    ["rdsDeletionProtection", "RDS deletion protection on",                               "Availability", "Prevents accidental terraform destroy / console delete."],
    ["computeMultiAZ",        "ECS service min 2 tasks across 2 AZs (or ASG min 2)",      "Availability", "One AZ can fail without an outage."],
    ["autoScaling",           "Auto Scaling policies on ECS service / ASG",                "Scalability",  "Target tracking on CPU or ALB request count."],
    ["albHttpsOnly",          "ALB listener 443 with ACM cert; port 80 redirects",        "Security",     "No plaintext HTTP to the origin."],
    ["albRestrictedToCloudFront", "ALB security group allows 443 only from CloudFront prefix list", "Security", "Stops attackers bypassing CloudFront/WAF."],
    ["waf",                   "AWS WAF on CloudFront / ALB",                               "Security",     "Managed rules for SQLi, XSS, bots."],
    ["ecsTaskRole",           "ECS task role + Lambda execution role defined (no instance-wide creds)", "Security", "Each workload gets its own identity."],
    ["iamWildcard",           "IAM policies use Action: * / Resource: *",                  "Security",     "Overly broad permissions."],
    ["hardcodedCredentials",  "AWS access keys or DB passwords hard-coded in code/env",    "Security",     "Use roles + Secrets Manager instead."],
    ["secretsManager",        "Secrets in Secrets Manager / SSM with rotation",             "Security",     "Injected at runtime by ECS/Lambda."],
    ["s3BlockPublic",         "S3 Block Public Access on; CloudFront OAC for static site", "Security",     "No public buckets."],
    ["s3Encrypted",           "S3 default encryption (SSE-S3/SSE-KMS)",                    "Security",     "Encryption at rest for objects."],
    ["s3Versioning",          "S3 versioning + lifecycle rules",                            "Availability", "Recover deleted/overwritten objects; move old data to cheaper tiers."],
    ["dynamodbPitr",          "DynamoDB point-in-time recovery",                            "Availability", "35-day continuous backup."],
    ["cwLogs",                "Centralised logs (ECS awslogs, Lambda, ALB access logs)",    "Observability","Retention set (not 'never expire')."],
    ["cwAlarms",              "CloudWatch alarms → SNS for 5xx, latency, CPU, DLQ depth, RDS storage", "Observability", "Someone is paged when things break."],
    ["containerInsights",     "Container Insights / dashboards",                            "Observability","Per-service CPU/memory/task metrics."],
    ["tracing",               "Distributed tracing (X-Ray / OpenTelemetry)",                "Observability","Find the slow hop in a request."],
    ["sqsDlq",                "SQS dead-letter queues + EventBridge/Lambda failure destinations", "Availability", "Poison messages don't block the queue."],
    ["rightSizing",           "Right-sized instances / Fargate tasks, Graviton, Savings Plans", "Cost",     "Biggest lever on the monthly bill."],
    ["s3Lifecycle",           "S3 lifecycle to IA/Glacier; CloudWatch log retention",      "Cost",         "Stop paying for data nobody reads."],
    ["multiRegionDr",         "Cross-Region snapshot copies / DR plan",                     "Availability", "Regional disaster recovery."]
  ];

  const PRESETS = {
    production: {
      name: "Production reference architecture",
      description: "Multi-AZ, private subnets, CloudFront + WAF, SG chain, Secrets Manager, alarms. What this module's main canvas shows.",
      settings: {
        privateSubnets: true, dbNoInternetRoute: true, routeTablesCorrect: true, sgChainCorrect: true, natPerAZ: true, natNeeded: true, vpcEndpoints: true,
        rdsPublic: false, rdsSgOpenToWorld: false, ec2Public: false, rdsMultiAZ: true, rdsEncrypted: true, tlsInTransit: true, rdsBackups: true, rdsDeletionProtection: true,
        computeMultiAZ: true, autoScaling: true, albHttpsOnly: true, albRestrictedToCloudFront: true, waf: true, ecsTaskRole: true, iamWildcard: false, hardcodedCredentials: false,
        secretsManager: true, s3BlockPublic: true, s3Encrypted: true, s3Versioning: true, dynamodbPitr: true, cwLogs: true, cwAlarms: true, containerInsights: true, tracing: false,
        sqsDlq: true, rightSizing: true, s3Lifecycle: true, multiRegionDr: false
      }
    },
    beginner: {
      name: "Beginner architecture (single AZ, quick start)",
      description: "Internet → ALB → ECS → RDS → S3 with defaults left as-is. Good for learning; run the review to see what production adds.",
      settings: {
        privateSubnets: true, dbNoInternetRoute: false, routeTablesCorrect: true, sgChainCorrect: false, natPerAZ: false, natNeeded: true, vpcEndpoints: false,
        rdsPublic: true, rdsSgOpenToWorld: true, ec2Public: false, rdsMultiAZ: false, rdsEncrypted: false, tlsInTransit: false, rdsBackups: false, rdsDeletionProtection: false,
        computeMultiAZ: false, autoScaling: false, albHttpsOnly: false, albRestrictedToCloudFront: false, waf: false, ecsTaskRole: false, iamWildcard: true, hardcodedCredentials: true,
        secretsManager: false, s3BlockPublic: false, s3Encrypted: false, s3Versioning: false, dynamodbPitr: false, cwLogs: true, cwAlarms: false, containerInsights: false, tracing: false,
        sqsDlq: false, rightSizing: false, s3Lifecycle: false, multiRegionDr: false
      }
    }
  };

  /* pass(s) → true means the check is satisfied. weight feeds the score. */
  const RULES = [
    // ---- Security ----
    { id: "public-rds", category: "Security", severity: "critical", weight: 10, pass: s => !s.rdsPublic,
      risk: "Public RDS instance", why: "A publicly accessible RDS endpoint gets a public IP and is discoverable by internet-wide scanners. Combined with a weak password or leaked credential this is a full data breach.", fix: "Modify the instance: Publicly accessible = No. Move it to a DB subnet group of private subnets whose route table has no IGW route. Reach it via SSM port forwarding or a bastion.", related: ["rds", "subnets", "route-tables"] },
    { id: "db-open-world", category: "Security", severity: "critical", weight: 10, pass: s => !s.rdsSgOpenToWorld,
      risk: "0.0.0.0/0 database access", why: "The RDS security group allows the engine port from any IP. Even inside a private subnet this means any compromised host in the VPC — or the internet if a route exists — can attempt logins.", fix: "Replace the CIDR source with the application security group id (ecs-sg / lambda-sg). Security-group references auto-cover new tasks and nothing else.", related: ["security-groups", "rds"] },
    { id: "hardcoded-creds", category: "Security", severity: "critical", weight: 9, pass: s => !s.hardcodedCredentials,
      risk: "Hard-coded AWS credentials / DB passwords", why: "Keys in code, task definitions, or .env files end up in git history and container images. Rotation becomes impossible without redeploys.", fix: "Use IAM roles (ECS task role, Lambda execution role, EC2 instance profile) for AWS access and Secrets Manager 'secrets' in the task definition for DB credentials.", related: ["iam", "ecs", "rds"] },
    { id: "iam-wildcard", category: "Security", severity: "high", weight: 7, pass: s => !s.iamWildcard,
      risk: "Overly broad IAM permissions", why: "Action: * on Resource: * means a bug or compromise in one task can delete every bucket and table in the account.", fix: "Scope actions to what the code calls and resources to specific ARNs. Use IAM Access Analyzer to generate least-privilege policies from CloudTrail activity.", related: ["iam"] },
    { id: "missing-task-role", category: "Security", severity: "high", weight: 6, pass: s => s.ecsTaskRole,
      risk: "Missing IAM role for workloads", why: "Without a task/execution role the application either fails to call AWS APIs or developers fall back to embedding access keys.", fix: "Create an ECS task role (app permissions) and a task execution role (ECR pull, logs, secrets). For Lambda create a dedicated execution role per function.", related: ["iam", "ecs", "lambda"] },
    { id: "public-ec2", category: "Security", severity: "high", weight: 6, pass: s => !s.ec2Public,
      risk: "Public EC2 instances (unnecessarily)", why: "Application servers with public IPs are exposed to SSH brute force and direct exploitation, bypassing the ALB, WAF, and CloudFront.", fix: "Launch instances in private app subnets with no public IP. Front them with the ALB; administer via SSM Session Manager.", related: ["ec2", "subnets"] },
    { id: "rds-encryption", category: "Security", severity: "high", weight: 6, pass: s => s.rdsEncrypted,
      risk: "Missing encryption at rest (RDS)", why: "Snapshots and storage volumes are readable if exfiltrated; many compliance regimes require encryption at rest.", fix: "Enable storage encryption with KMS at creation. For an existing instance: snapshot → copy with encryption → restore → cut over.", related: ["rds"] },
    { id: "s3-encryption", category: "Security", severity: "medium", weight: 4, pass: s => s.s3Encrypted,
      risk: "Missing encryption (S3)", why: "Objects stored without default encryption.", fix: "Set bucket default encryption to SSE-S3 or SSE-KMS and add a bucket policy denying unencrypted PutObject.", related: ["s3"] },
    { id: "https", category: "Security", severity: "high", weight: 6, pass: s => s.albHttpsOnly && s.tlsInTransit,
      risk: "Missing HTTPS / TLS in transit", why: "Plaintext HTTP exposes session tokens and personal data; unencrypted DB connections can be sniffed by a compromised host in the VPC.", fix: "ALB 443 listener with an ACM certificate, HTTP → HTTPS redirect, CloudFront viewer protocol policy redirect-to-https, rds.force_ssl = 1.", related: ["alb", "cloudfront", "rds"] },
    { id: "alb-open", category: "Security", severity: "medium", weight: 4, pass: s => s.albRestrictedToCloudFront,
      risk: "ALB reachable directly, bypassing CloudFront/WAF", why: "If the ALB accepts 443 from 0.0.0.0/0, attackers can skip WAF rules and caching by hitting the ALB DNS name.", fix: "Allow 443 only from the AWS-managed prefix list 'com.amazonaws.global.cloudfront.origin-facing' and verify a secret custom origin header.", related: ["alb", "security-groups", "cloudfront"] },
    { id: "waf", category: "Security", severity: "medium", weight: 4, pass: s => s.waf,
      risk: "No WAF", why: "Common web attacks (SQL injection, XSS, credential stuffing, bad bots) reach the application unfiltered.", fix: "Attach an AWS WAF web ACL with AWS Managed Rules (Core rule set, Known bad inputs, SQLi) to the CloudFront distribution.", related: ["cloudfront", "alb"] },
    { id: "s3-public", category: "Security", severity: "critical", weight: 9, pass: s => s.s3BlockPublic,
      risk: "Public S3 bucket", why: "Public buckets are the most common source of large data leaks. Static websites do not need a public bucket when CloudFront uses OAC.", fix: "Turn on Block Public Access at the account and bucket level; serve the frontend via CloudFront with Origin Access Control and a bucket policy scoped to the distribution.", related: ["s3", "cloudfront"] },
    { id: "secrets", category: "Security", severity: "medium", weight: 4, pass: s => s.secretsManager,
      risk: "Secrets not centrally managed", why: "Without Secrets Manager/SSM there is no rotation, no audit trail, and secrets sprawl across CI, laptops, and env files.", fix: "Store DB credentials and API keys in Secrets Manager; reference them in the ECS task definition 'secrets' block and Lambda via SDK at cold start.", related: ["iam", "ecs", "rds"] },
    { id: "sg-chain", category: "Security", severity: "high", weight: 6, pass: s => s.sgChainCorrect,
      risk: "Incorrect security group relationships", why: "Rules that use CIDRs or allow-all between tiers let a compromised component reach anything in the VPC.", fix: "alb-sg: 443 from CloudFront prefix list → ecs-sg: 8080 from alb-sg → rds-sg: 5432 from ecs-sg. Nothing else inbound.", related: ["security-groups"] },

    // ---- Availability ----
    { id: "multi-az-rds", category: "Availability", severity: "high", weight: 9, pass: s => s.rdsMultiAZ,
      risk: "Missing Multi-AZ (RDS)", why: "A single-AZ database goes down for every maintenance reboot, instance failure, or AZ event; recovery is a restore from backup with data loss up to 5 minutes.", fix: "Enable Multi-AZ (instance deployment or Multi-AZ DB cluster). Failover becomes automatic with a DNS switch in ~1–2 minutes.", related: ["rds"] },
    { id: "multi-az-compute", category: "Availability", severity: "high", weight: 8, pass: s => s.computeMultiAZ,
      risk: "Compute in a single AZ / single task", why: "One task or one AZ means one failure equals an outage. The ALB cannot route around a tier that has no healthy targets left.", fix: "ECS service desired/min count ≥ 2 with subnets in both AZs (the scheduler spreads tasks); ASG min 2 across 2 AZs.", related: ["ecs", "auto-scaling", "subnets"] },
    { id: "backups", category: "Availability", severity: "high", weight: 7, pass: s => s.rdsBackups,
      risk: "No backups / untested restore", why: "Multi-AZ protects against infrastructure failure, not against DROP TABLE or a bad migration. Only backups do.", fix: "Backup retention 7–35 days, point-in-time recovery, periodic restore drills, cross-Region snapshot copies for DR.", related: ["rds"] },
    { id: "deletion-protection", category: "Availability", severity: "medium", weight: 3, pass: s => s.rdsDeletionProtection,
      risk: "No deletion protection", why: "A wrong `terraform destroy` or console click can delete the production database.", fix: "Enable deletion protection and require a final snapshot on delete.", related: ["rds"] },
    { id: "nat-per-az", category: "Availability", severity: "medium", weight: 5, pass: s => s.natPerAZ || !s.natNeeded,
      risk: "Single NAT Gateway shared across AZs", why: "If AZ-A (hosting the only NAT) fails, tasks in AZ-B lose outbound internet even though they are healthy — and you pay cross-AZ data charges meanwhile.", fix: "One NAT Gateway per AZ with a per-AZ private route table pointing at the local NAT.", related: ["nat-gateway", "route-tables"] },
    { id: "dlq", category: "Availability", severity: "medium", weight: 4, pass: s => s.sqsDlq,
      risk: "No dead-letter queues", why: "A single poison message is retried forever, blocking FIFO queues and burning worker capacity.", fix: "Configure a DLQ with maxReceiveCount 3–5 on every queue; on-failure destinations for async Lambda and EventBridge targets; alarm on DLQ depth ≥ 1.", related: ["sqs", "eventbridge", "lambda"] },
    { id: "s3-versioning", category: "Availability", severity: "low", weight: 3, pass: s => s.s3Versioning,
      risk: "S3 versioning off", why: "Overwrites and deletes are permanent.", fix: "Enable versioning with a lifecycle rule to expire old versions.", related: ["s3"] },
    { id: "ddb-pitr", category: "Availability", severity: "low", weight: 3, pass: s => s.dynamodbPitr,
      risk: "DynamoDB PITR off", why: "No way to recover a table after a bad batch write.", fix: "Enable point-in-time recovery on production tables.", related: ["dynamodb"] },
    { id: "dr", category: "Availability", severity: "low", weight: 3, pass: s => s.multiRegionDr,
      risk: "No cross-Region DR", why: "A Regional event (rare but real) leaves no recovery path.", fix: "Copy RDS snapshots and replicate critical S3 data to a second Region; document RTO/RPO.", related: ["rds", "s3"] },

    // ---- Networking ----
    { id: "private-subnets", category: "Networking", severity: "critical", weight: 10, pass: s => s.privateSubnets,
      risk: "No private subnets", why: "Everything in a public subnet has a path from the internet; you rely entirely on security groups being perfect.", fix: "Three tiers: public (ALB, NAT), private app (ECS/EC2/Lambda ENIs), private DB (RDS).", related: ["subnets", "vpc"] },
    { id: "db-route", category: "Networking", severity: "high", weight: 8, pass: s => s.dbNoInternetRoute,
      risk: "Database subnets have an internet route", why: "If the DB route table has 0.0.0.0/0 → IGW the subnet is public; if → NAT, a compromised DB host can exfiltrate data outbound.", fix: "Database route table contains only the local route (and gateway endpoint routes if needed).", related: ["route-tables", "subnets"] },
    { id: "route-tables", category: "Networking", severity: "high", weight: 7, pass: s => s.routeTablesCorrect,
      risk: "Incorrect route tables", why: "A private subnet pointing at the IGW becomes public; a public subnet pointing at NAT breaks the ALB.", fix: "Public RT: 0.0.0.0/0 → igw. Private RT (per AZ): 0.0.0.0/0 → nat in that AZ. DB RT: local only.", related: ["route-tables"] },
    { id: "endpoints", category: "Networking", severity: "medium", weight: 5, pass: s => s.vpcEndpoints,
      risk: "No VPC endpoints for AWS services", why: "S3, DynamoDB, ECR, and CloudWatch traffic traverses the NAT and the public internet path unnecessarily.", fix: "Gateway endpoints for S3 and DynamoDB (free); interface endpoints for ECR (api + dkr), CloudWatch Logs, Secrets Manager, SQS.", related: ["vpc", "nat-gateway"] },
    { id: "sg-chain-net", category: "Networking", severity: "high", weight: 6, pass: s => s.sgChainCorrect,
      risk: "Security group chain broken", why: "See Security → Incorrect security group relationships.", fix: "Reference security groups, not CIDRs, between tiers.", related: ["security-groups"] },

    // ---- Scalability ----
    { id: "autoscaling", category: "Scalability", severity: "high", weight: 8, pass: s => s.autoScaling,
      risk: "No Auto Scaling", why: "Fixed capacity either wastes money at night or falls over during a sale.", fix: "Target-tracking on ECS CPU (60%) or ALBRequestCountPerTarget; ASG target tracking; scheduled scaling for known peaks.", related: ["auto-scaling", "ecs"] },
    { id: "multi-az-scale", category: "Scalability", severity: "medium", weight: 5, pass: s => s.computeMultiAZ,
      risk: "Cannot scale across AZs", why: "Tasks pinned to one AZ hit that AZ's capacity limits.", fix: "Give the ECS service subnets in every AZ.", related: ["ecs", "subnets"] },
    { id: "async", category: "Scalability", severity: "medium", weight: 5, pass: s => s.sqsDlq,
      risk: "Synchronous heavy work", why: "Without queues, slow tasks (emails, PDFs, image processing) hold HTTP connections and multiply load.", fix: "Offload to SQS + worker service; scale workers on ApproximateNumberOfMessagesVisible.", related: ["sqs", "ecs"] },
    { id: "endpoints-scale", category: "Scalability", severity: "low", weight: 3, pass: s => s.vpcEndpoints,
      risk: "NAT as a scaling bottleneck", why: "All AWS API traffic through NAT competes for NAT bandwidth and port allocations.", fix: "VPC endpoints remove S3/DynamoDB/ECR traffic from the NAT path.", related: ["vpc", "nat-gateway"] },
    { id: "tls-scale", category: "Scalability", severity: "low", weight: 2, pass: s => s.albHttpsOnly,
      risk: "TLS offload not at the ALB/CloudFront", why: "Terminating TLS in each container wastes CPU.", fix: "Terminate at CloudFront and the ALB with ACM certificates.", related: ["alb", "cloudfront"] },

    // ---- Observability ----
    { id: "logs", category: "Observability", severity: "high", weight: 7, pass: s => s.cwLogs,
      risk: "No centralised logs", why: "You cannot debug a request across ECS tasks and Lambda without a searchable log store.", fix: "awslogs driver for ECS, Lambda default log groups, ALB access logs to S3, CloudWatch Logs Insights queries saved.", related: ["cloudwatch", "ecs", "lambda", "alb"] },
    { id: "alarms", category: "Observability", severity: "high", weight: 8, pass: s => s.cwAlarms,
      risk: "Missing CloudWatch alarms", why: "Metrics nobody is alerted on are decoration. Outages get discovered by customers.", fix: "Alarms → SNS for ALB 5XX rate, TargetResponseTime p99, ECS CPU/memory, RDS FreeStorageSpace/CPU/connections, SQS DLQ depth, Lambda Errors/Throttles, NAT ErrorPortAllocation.", related: ["cloudwatch", "sns"] },
    { id: "insights", category: "Observability", severity: "medium", weight: 4, pass: s => s.containerInsights,
      risk: "No dashboards / Container Insights", why: "Without per-service metrics you cannot right-size or spot memory leaks.", fix: "Enable Container Insights on the cluster and build a service dashboard.", related: ["cloudwatch", "ecs"] },
    { id: "tracing", category: "Observability", severity: "medium", weight: 4, pass: s => s.tracing,
      risk: "No distributed tracing", why: "When checkout is slow you cannot tell whether it is the ALB, the container, RDS, or the payment provider.", fix: "Add AWS X-Ray or OpenTelemetry (ADOT collector sidecar) and propagate trace ids through SQS/EventBridge messages.", related: ["cloudwatch"] },

    // ---- Cost ----
    { id: "nat-unnecessary", category: "Cost", severity: "medium", weight: 5, pass: s => s.natNeeded || !s.natPerAZ,
      risk: "Unnecessary NAT Gateway", why: "NAT Gateways cost per hour plus per GB processed. If all outbound traffic is to AWS services covered by VPC endpoints, the NAT is pure waste.", fix: "Inventory outbound destinations. If only AWS APIs, replace NAT with gateway/interface endpoints; otherwise keep NAT but move S3/DynamoDB/ECR traffic to endpoints.", related: ["nat-gateway", "vpc"] },
    { id: "endpoints-cost", category: "Cost", severity: "medium", weight: 5, pass: s => s.vpcEndpoints,
      risk: "Paying NAT data charges for S3/DynamoDB/ECR", why: "Every image pull and S3 upload through NAT is billed per GB.", fix: "Gateway endpoints for S3 and DynamoDB are free. Interface endpoints have an hourly cost — compare against your NAT GB volume.", related: ["vpc", "nat-gateway"] },
    { id: "rightsizing", category: "Cost", severity: "medium", weight: 6, pass: s => s.rightSizing,
      risk: "Over-provisioned compute / no commitments", why: "Idle CPU and on-demand pricing for steady-state workloads are the largest avoidable costs.", fix: "Use Container Insights to right-size tasks; move to Graviton (arm64); buy Compute Savings Plans for the baseline; use Fargate Spot for workers.", related: ["ecs", "ec2", "auto-scaling"] },
    { id: "lifecycle", category: "Cost", severity: "low", weight: 4, pass: s => s.s3Lifecycle,
      risk: "No storage lifecycle / log retention", why: "Logs set to 'never expire' and images kept in S3 Standard forever grow the bill every month.", fix: "S3 lifecycle to Intelligent-Tiering/IA/Glacier; CloudWatch log group retention 30–90 days; ECR lifecycle policies to prune untagged images.", related: ["s3", "cloudwatch", "ecr"] },
    { id: "autoscale-cost", category: "Cost", severity: "medium", weight: 5, pass: s => s.autoScaling,
      risk: "Fixed capacity 24/7", why: "Paying for peak capacity at 3am.", fix: "Auto Scaling with sensible minimums; scheduled scale-in for predictable quiet hours.", related: ["auto-scaling"] }
  ];

  const CATEGORIES = ["Security", "Availability", "Networking", "Scalability", "Observability", "Cost"];
  const CATEGORY_WEIGHT = { Security: 0.25, Availability: 0.2, Networking: 0.15, Scalability: 0.15, Observability: 0.15, Cost: 0.1 };

  function evaluate(settings) {
    const results = RULES.map(r => ({ ...r, passed: !!r.pass(settings) }));
    const categories = CATEGORIES.map(cat => {
      const rs = results.filter(r => r.category === cat);
      const total = rs.reduce((a, r) => a + r.weight, 0);
      const got = rs.reduce((a, r) => a + (r.passed ? r.weight : 0), 0);
      return { name: cat, score: total ? Math.round((got / total) * 100) : 100, rules: rs, total, got };
    });
    const overall = Math.round(categories.reduce((a, c) => a + c.score * CATEGORY_WEIGHT[c.name], 0));
    const findings = results.filter(r => !r.passed).sort((a, b) => sevRank(a.severity) - sevRank(b.severity));
    return { categories, overall, findings, results };
  }
  function sevRank(s) { return { critical: 0, high: 1, medium: 2, low: 3 }[s] ?? 9; }

  return { SETTINGS, PRESETS, RULES, CATEGORIES, CATEGORY_WEIGHT, evaluate };
})();
