/* Canvas layouts. Positions are computed from a few constants so the diagram stays aligned.
   node.inst = unique instance id on the canvas; node.service = service id (null for pseudo nodes).
   Boundaries are drawn behind nodes; clicking a boundary opens the related service. */
window.AWS_LAYOUTS = (function () {
  /* ---------------- PRODUCTION ---------------- */
  const P = { W: 2010, H: 1240 };
  const REGION = { x: 262, y: 130, w: 1690, h: 1080 };
  const VPC    = { x: 290, y: 200, w: 980,  h: 950 };
  const AZ_W = 460, AZ_GAP = 18;
  const AZA = { x: VPC.x + 22, y: 250, w: AZ_W, h: 790 };
  const AZB = { x: AZA.x + AZ_W + AZ_GAP, y: 250, w: AZ_W, h: 790 };
  const LANE = { x: 1332, y: 200, w: 580, h: 950 };
  const COLA = LANE.x + 18, COLB = LANE.x + 318, CW = 240, NH = 66;

  const sub = (az, y, h) => ({ x: az.x + 12, y, w: az.w - 24, h });
  const PUB_Y = 290, PUB_H = 180, APP_Y = 510, APP_H = 290, DB_Y = 840, DB_H = 170;

  const boundaries = [
    { id: "region", kind: "region", label: "AWS Region · us-east-1", ...REGION, service: null },
    { id: "vpc", kind: "vpc", label: "VPC · 10.0.0.0/16", ...VPC, service: "vpc" },
    { id: "az-a", kind: "az", label: "Availability Zone A · us-east-1a", ...AZA, service: "subnets" },
    { id: "az-b", kind: "az", label: "Availability Zone B · us-east-1b", ...AZB, service: "subnets" },
    { id: "pub-a", kind: "public", label: "Public subnet · 10.0.1.0/24", ...sub(AZA, PUB_Y, PUB_H), service: "subnets", cidr: "10.0.1.0/24", tier: "public", az: "A" },
    { id: "pub-b", kind: "public", label: "Public subnet · 10.0.2.0/24", ...sub(AZB, PUB_Y, PUB_H), service: "subnets", cidr: "10.0.2.0/24", tier: "public", az: "B" },
    { id: "app-a", kind: "private", label: "Private app subnet · 10.0.11.0/24", ...sub(AZA, APP_Y, APP_H), service: "subnets", cidr: "10.0.11.0/24", tier: "app", az: "A" },
    { id: "app-b", kind: "private", label: "Private app subnet · 10.0.12.0/24", ...sub(AZB, APP_Y, APP_H), service: "subnets", cidr: "10.0.12.0/24", tier: "app", az: "B" },
    { id: "db-a", kind: "db", label: "Private DB subnet · 10.0.21.0/24", ...sub(AZA, DB_Y, DB_H), service: "subnets", cidr: "10.0.21.0/24", tier: "db", az: "A" },
    { id: "db-b", kind: "db", label: "Private DB subnet · 10.0.22.0/24", ...sub(AZB, DB_Y, DB_H), service: "subnets", cidr: "10.0.22.0/24", tier: "db", az: "B" },
    { id: "lane", kind: "managed", label: "AWS managed services · regional · outside your VPC (reached via VPC endpoints or NAT)", ...LANE, service: null }
  ];

  const ALB_X = 540, ALB_W = 480;
  const nodes = [
    /* top band — global / edge */
    { inst: "users", service: null, pseudo: true, icon: "👤", label: "Users / Internet", sub: "browsers · mobile apps", x: 40, y: 30, w: 200, h: 70 },
    { inst: "cloudfront", service: "cloudfront", x: 520, y: 30, w: 240, h: 70, sub: "global edge · CDN + TLS + WAF" },
    { inst: "iam", service: "iam", x: 1350, y: 30, w: 240, h: 70, sub: "global · roles & policies" },
    { inst: "authorization", service: "authorization", x: 1650, y: 30, w: 240, h: 70, sub: "end-user AuthN/AuthZ (Cognito/JWT)" },

    /* VPC edge */
    { inst: "igw", service: "igw", x: 680, y: 165, w: 200, h: 62, sub: "VPC ↔ internet door" },
    { inst: "alb", service: "alb", x: ALB_X, y: 310, w: ALB_W, h: 64, sub: "internet-facing · nodes in both AZs · HTTPS 443" },
    { inst: "nat-a", service: "nat-gateway", label: "NAT Gateway", x: AZA.x + 24, y: 390, w: 190, h: 60, sub: "Elastic IP · outbound only" },
    { inst: "nat-b", service: "nat-gateway", label: "NAT Gateway", x: AZB.x + 24, y: 390, w: 190, h: 60, sub: "Elastic IP · outbound only" },

    /* app tier AZ-A */
    { inst: "ecs-a", service: "ecs", label: "ECS API service", x: AZA.x + 24, y: 535, w: 205, h: 70, sub: "Fargate tasks · :8080" },
    { inst: "ec2-a", service: "ec2", label: "EC2 (optional)", optional: true, x: AZA.x + 241, y: 535, w: 205, h: 70, sub: "ASG instances · alternative" },
    { inst: "worker-a", service: "ecs", label: "ECS worker service", x: AZA.x + 24, y: 635, w: 205, h: 70, sub: "polls SQS · Fargate" },
    { inst: "lambda-eni-a", service: "lambda", label: "Lambda in VPC (optional)", optional: true, x: AZA.x + 241, y: 635, w: 205, h: 70, sub: "ENI here only if VPC-attached" },
    /* app tier AZ-B */
    { inst: "ecs-b", service: "ecs", label: "ECS API service", x: AZB.x + 24, y: 535, w: 205, h: 70, sub: "Fargate tasks · :8080" },
    { inst: "ec2-b", service: "ec2", label: "EC2 (optional)", optional: true, x: AZB.x + 241, y: 535, w: 205, h: 70, sub: "ASG instances · alternative" },
    { inst: "worker-b", service: "ecs", label: "ECS worker service", x: AZB.x + 24, y: 635, w: 205, h: 70, sub: "polls SQS · Fargate" },
    { inst: "lambda-eni-b", service: "lambda", label: "Lambda in VPC (optional)", optional: true, x: AZB.x + 241, y: 635, w: 205, h: 70, sub: "ENI here only if VPC-attached" },

    /* db tier */
    { inst: "rds-primary", service: "rds", label: "RDS PostgreSQL · Primary", x: AZA.x + AZA.w / 2 - 125, y: 865, w: 250, h: 84, sub: "Multi-AZ · :5432 · encrypted" },
    { inst: "rds-standby", service: "rds", label: "RDS · Standby (Multi-AZ)", x: AZB.x + AZB.w / 2 - 125, y: 865, w: 250, h: 84, sub: "synchronous replica · auto failover" },

    /* VPC-level concept chips */
    { inst: "route-tables", service: "route-tables", chip: true, x: VPC.x + 22, y: 1068, w: 176, h: 52, sub: "public / private / db" },
    { inst: "nacl", service: "nacl", chip: true, x: VPC.x + 216, y: 1068, w: 176, h: 52, sub: "stateless · per subnet" },
    { inst: "security-groups", service: "security-groups", chip: true, x: VPC.x + 410, y: 1068, w: 176, h: 52, sub: "stateful · per ENI" },
    { inst: "cidr", service: "cidr", chip: true, x: VPC.x + 604, y: 1068, w: 176, h: 52, sub: "/16 → /24 plan" },
    { inst: "vpc-endpoints", service: "vpc", chip: true, label: "VPC Endpoints", x: VPC.x + 798, y: 1068, w: 160, h: 52, sub: "S3 · DynamoDB gateway" },

    /* managed lane */
    { inst: "ecr", service: "ecr", x: COLA, y: 240, w: CW, h: NH, sub: "container images" },
    { inst: "api-gateway", service: "api-gateway", x: COLB, y: 240, w: CW, h: NH, sub: "alternative entry · REST/HTTP APIs" },
    { inst: "s3", service: "s3", x: COLA, y: 340, w: CW, h: NH, sub: "static site · images · logs" },
    { inst: "lambda", service: "lambda", x: COLB, y: 340, w: CW, h: NH, sub: "serverless functions" },
    { inst: "dynamodb", service: "dynamodb", x: COLA, y: 440, w: CW, h: NH, sub: "carts · sessions · counters" },
    { inst: "sqs", service: "sqs", x: COLA, y: 560, w: CW, h: NH, sub: "job queue + DLQ" },
    { inst: "sns", service: "sns", x: COLB, y: 560, w: CW, h: NH, sub: "notifications · fan-out" },
    { inst: "eventbridge", service: "eventbridge", x: COLA, y: 680, w: CW, h: NH, sub: "business events · rules" },
    { inst: "step-functions", service: "step-functions", x: COLB, y: 680, w: CW, h: NH, sub: "order fulfillment workflow" },
    { inst: "cloudwatch", service: "cloudwatch", x: COLA, y: 860, w: COLB + CW - COLA, h: 70, sub: "metrics · logs · alarms · dashboards" },
    { inst: "auto-scaling", service: "auto-scaling", x: COLA, y: 970, w: COLB + CW - COLA, h: 66, sub: "ECS service scaling · EC2 ASG" }
  ];

  const captions = [
    { x: 40, y: 118, text: "Global / edge — outside any Region", cls: "cap" },
    { x: 1350, y: 118, text: "Identity — global (IAM) · application layer (Authorization)", cls: "cap" },
    { x: COLA, y: 232, text: "Registry · storage · NoSQL", cls: "cap" },
    { x: COLB, y: 232, text: "Serverless path (alternative to ALB → ECS)", cls: "cap" },
    { x: COLA, y: 552, text: "Messaging · events · workflows", cls: "cap" },
    { x: COLA, y: 852, text: "Monitoring & scaling control loop", cls: "cap" },
    { x: VPC.x + 22, y: 1060, text: "VPC building blocks (click to explore)", cls: "cap" },
    { x: 262, y: 1232, text: "Legend: solid = request/response · dashed = async / events · dotted = monitoring & control. Faded nodes are optional/alternative.", cls: "cap" }
  ];

  /* edges reference connection ids; via = extra waypoints for routing; from/to = instance ids */
  const RM = 1922; // right margin x for routed lines
  const edges = [
    { conn: "users-cloudfront", from: "users", to: "cloudfront" },
    { conn: "users-api-gateway", from: "users", to: "api-gateway", via: [[300, 12], [RM + 20, 12], [RM + 20, 273]], toSide: "right", labelAt: 0.35 },
    { conn: "cloudfront-alb", from: "cloudfront", to: "alb", via: [[660, 240]], toSide: "top", fromSide: "bottom" },
    { conn: "cloudfront-s3", from: "cloudfront", to: "s3", via: [[1120, 65], [1300, 260]], toSide: "left" },
    { conn: "igw-alb", from: "igw", to: "alb", fromSide: "bottom", toSide: "top", labelAt: 0.82 },
    { conn: "alb-ecs", from: "alb", to: "ecs-a", fromSide: "bottom", toSide: "top" },
    { conn: "alb-ecs", from: "alb", to: "ecs-b", fromSide: "bottom", toSide: "top" },
    { conn: "alb-ec2", from: "alb", to: "ec2-a", fromSide: "bottom", toSide: "top" },
    { conn: "alb-ec2", from: "alb", to: "ec2-b", fromSide: "bottom", toSide: "top" },
    { conn: "api-gateway-lambda", from: "api-gateway", to: "lambda", fromSide: "bottom", toSide: "top" },
    { conn: "ecs-rds", from: "ecs-a", to: "rds-primary", fromSide: "bottom", toSide: "top", via: [[AZA.x + 126, 760]] },
    { conn: "ecs-rds", from: "ecs-b", to: "rds-primary", fromSide: "bottom", toSide: "top", via: [[AZB.x + 126, 815], [AZA.x + AZA.w - 20, 835]] },
    { conn: "ecs-rds", from: "worker-a", to: "rds-primary", fromSide: "bottom", toSide: "top" },
    { conn: "rds-replication", from: "rds-primary", to: "rds-standby", fromSide: "right", toSide: "left" },
    { conn: "ecs-nat-gateway", from: "ecs-a", to: "nat-a", fromSide: "top", toSide: "bottom" },
    { conn: "ecs-nat-gateway", from: "ecs-b", to: "nat-b", fromSide: "top", toSide: "bottom" },
    { conn: "nat-gateway-igw", from: "nat-a", to: "igw", fromSide: "top", toSide: "left", via: [[AZA.x + 24 + 95, 250], [AZA.x + 24 + 95, 196]] },
    { conn: "nat-gateway-igw", from: "nat-b", to: "igw", fromSide: "top", toSide: "right", via: [[AZB.x + 24 + 95, 250], [AZB.x + 24 + 95, 196]] },
    { conn: "ecr-ecs", from: "ecr", to: "ecs-b", fromSide: "left", toSide: "right", via: [[1300, 300], [1300, 555]], labelAt: 0.5 },
    { conn: "ecs-s3", from: "ecs-b", to: "s3", fromSide: "right", toSide: "left", via: [[1290, 480]], labelAt: 0.78 },
    { conn: "ecs-dynamodb", from: "ecs-b", to: "dynamodb", fromSide: "right", toSide: "left", labelAt: 0.62 },
    { conn: "ecs-sqs", from: "ecs-b", to: "sqs", fromSide: "right", toSide: "left", labelAt: 0.3 },
    { conn: "sqs-ecs", from: "sqs", to: "worker-b", fromSide: "left", toSide: "right", labelAt: 0.3 },
    { conn: "ecs-eventbridge", from: "ecs-b", to: "eventbridge", fromSide: "right", toSide: "left", via: [[1290, 690]], labelAt: 0.8 },
    { conn: "ecs-sns", from: "worker-b", to: "sns", fromSide: "right", toSide: "bottom", via: [[1310, 760], [COLB + 40, 660]], labelAt: 0.88 },
    { conn: "lambda-dynamodb", from: "lambda", to: "dynamodb", fromSide: "left", toSide: "right", via: [[COLB - 30, 440]] },
    { conn: "sns-sqs", from: "sns", to: "sqs", fromSide: "left", toSide: "right" },
    { conn: "eventbridge-lambda", from: "eventbridge", to: "lambda", fromSide: "top", toSide: "left", via: [[COLA + CW + 20, 560], [COLB - 30, 380]] },
    { conn: "eventbridge-step-functions", from: "eventbridge", to: "step-functions", fromSide: "right", toSide: "left" },
    { conn: "step-functions-lambda", from: "step-functions", to: "lambda", fromSide: "right", toSide: "right", via: [[RM - 30, 700], [RM - 30, 380]] },
    { conn: "step-functions-sns", from: "step-functions", to: "sns", fromSide: "top", toSide: "bottom" },
    { conn: "ecs-cloudwatch", from: "ecs-b", to: "cloudwatch", fromSide: "bottom", toSide: "left", via: [[AZB.x + 126, 760], [1290, 830]], labelAt: 0.45 },
    { conn: "alb-cloudwatch", from: "alb", to: "cloudwatch", fromSide: "right", toSide: "left", via: [[1300, 342], [1310, 850]], labelAt: 0.12 },
    { conn: "rds-cloudwatch", from: "rds-standby", to: "cloudwatch", fromSide: "right", toSide: "left", via: [[1290, 907]] },
    { conn: "sqs-cloudwatch", from: "sqs", to: "cloudwatch", fromSide: "left", toSide: "left", via: [[LANE.x + 6, 600], [LANE.x + 6, 880]] },
    { conn: "lambda-cloudwatch", from: "lambda", to: "cloudwatch", fromSide: "right", toSide: "right", via: [[RM - 16, 373], [RM - 16, 895]] },
    { conn: "api-gateway-cloudwatch", from: "api-gateway", to: "cloudwatch", fromSide: "right", toSide: "right", via: [[RM - 4, 273], [RM - 4, 905]] },
    { conn: "cloudwatch-auto-scaling", from: "cloudwatch", to: "auto-scaling", fromSide: "bottom", toSide: "top" },
    { conn: "auto-scaling-ecs", from: "auto-scaling", to: "ecs-b", fromSide: "left", toSide: "right", via: [[1305, 1003], [1305, 600]], labelAt: 0.5 },
    { conn: "cloudwatch-sns", from: "cloudwatch", to: "sns", fromSide: "right", toSide: "right", via: [[RM - 28, 870], [RM - 28, 593]] }
  ];

  /* ---------------- BEGINNER ---------------- */
  const B = { W: 1400, H: 720 };
  const bBoundaries = [
    { id: "region", kind: "region", label: "AWS Region · us-east-1", x: 262, y: 100, w: 1100, h: 590, service: null },
    { id: "vpc", kind: "vpc", label: "VPC · 10.0.0.0/16", x: 290, y: 150, w: 780, h: 510, service: "vpc" },
    { id: "az-a", kind: "az", label: "Availability Zone A (only one!)", x: 312, y: 195, w: 736, h: 440, service: "subnets" },
    { id: "pub-a", kind: "public", label: "Public subnet · 10.0.1.0/24", x: 324, y: 235, w: 712, h: 150, service: "subnets", cidr: "10.0.1.0/24", tier: "public", az: "A" },
    { id: "app-a", kind: "private", label: "Private subnet · 10.0.11.0/24 (app + database together)", x: 324, y: 420, w: 712, h: 190, service: "subnets", cidr: "10.0.11.0/24", tier: "app", az: "A" },
    { id: "lane", kind: "managed", label: "AWS managed · outside VPC", x: 1100, y: 150, w: 240, h: 510, service: null }
  ];
  const bNodes = [
    { inst: "users", service: null, pseudo: true, icon: "👤", label: "Users / Internet", sub: "browsers", x: 40, y: 280, w: 190, h: 70 },
    { inst: "igw", service: "igw", x: 580, y: 120, w: 200, h: 60, sub: "VPC ↔ internet" },
    { inst: "alb", service: "alb", x: 480, y: 280, w: 400, h: 64, sub: "HTTP 80 (no TLS yet!) · single AZ" },
    { inst: "ecs-a", service: "ecs", label: "ECS API service", x: 380, y: 470, w: 240, h: 80, sub: "1 Fargate task · :8080" },
    { inst: "rds-primary", service: "rds", label: "RDS PostgreSQL", x: 740, y: 470, w: 260, h: 80, sub: "single-AZ · no standby" },
    { inst: "s3", service: "s3", x: 1120, y: 380, w: 200, h: 70, sub: "product images" },
    { inst: "iam", service: "iam", x: 1120, y: 200, w: 200, h: 70, sub: "roles (often forgotten)" }
  ];
  const bEdges = [
    { conn: "users-alb-direct", from: "users", to: "alb", fromSide: "right", toSide: "left" },
    { conn: "igw-alb", from: "igw", to: "alb", fromSide: "bottom", toSide: "top", labelAt: 0.82 },
    { conn: "alb-ecs", from: "alb", to: "ecs-a", fromSide: "bottom", toSide: "top" },
    { conn: "ecs-rds", from: "ecs-a", to: "rds-primary", fromSide: "right", toSide: "left" },
    { conn: "ecs-s3", from: "ecs-a", to: "s3", fromSide: "top", toSide: "left", via: [[900, 420]] }
  ];
  const bCaptions = [
    { x: 262, y: 712, text: "Beginner architecture: one AZ, no CloudFront, no NAT, no queues, no Multi-AZ. Switch to Production to see what gets added and why.", cls: "cap" }
  ];

  return {
    production: { size: P, boundaries, nodes, edges, captions },
    beginner: { size: B, boundaries: bBoundaries, nodes: bNodes, edges: bEdges, captions: bCaptions },
    /* What Production adds over Beginner, and why. Shown in the architecture-mode toggle panel. */
    diff: [
      { added: "Second Availability Zone", why: "A single AZ is a single point of failure. Production spreads ALB nodes, ECS tasks, NAT, and the RDS standby across two AZs so one data-center failure is survivable.", services: ["subnets", "rds", "ecs"] },
      { added: "CloudFront (CDN) + HTTPS", why: "Terminates TLS at the edge, caches static content, absorbs traffic spikes and DDoS, and hides the ALB from direct access.", services: ["cloudfront", "alb"] },
      { added: "Separate private DB subnets + DB route table", why: "Databases get their own subnet tier with no internet route at all, so a misconfiguration elsewhere cannot expose them.", services: ["subnets", "route-tables", "rds"] },
      { added: "NAT Gateway per AZ", why: "Private tasks need outbound access to payment/shipping APIs and image pulls, without being reachable from the internet.", services: ["nat-gateway", "route-tables", "igw"] },
      { added: "Security group chain + NACLs", why: "alb-sg → ecs-sg → rds-sg by reference. Only the previous tier can talk to the next. NACLs add a coarse subnet-level guard.", services: ["security-groups", "nacl"] },
      { added: "RDS Multi-AZ, encryption, backups", why: "Automatic failover in ~1–2 minutes, encrypted storage, and point-in-time recovery from bad deploys.", services: ["rds"] },
      { added: "ECR + IAM task roles", why: "Images come from a private registry; tasks get least-privilege identities instead of embedded keys.", services: ["ecr", "iam"] },
      { added: "SQS worker + SNS + EventBridge + Step Functions", why: "Slow or failure-prone work (emails, invoices, fulfillment) is done asynchronously with retries and dead-letter queues, keeping checkout fast and reliable.", services: ["sqs", "sns", "eventbridge", "step-functions"] },
      { added: "Lambda + API Gateway (serverless path)", why: "Event handlers and a few endpoints run as functions — no servers to scale for spiky, short jobs. Shown as an alternative, not a replacement, for the ECS API.", services: ["lambda", "api-gateway"] },
      { added: "DynamoDB", why: "Carts, sessions, and counters are high-volume key/value data; DynamoDB scales them without touching the relational database.", services: ["dynamodb"] },
      { added: "Auto Scaling", why: "Task count follows load: more during a sale, fewer at night. Also replaces failed tasks/instances.", services: ["auto-scaling"] },
      { added: "CloudWatch alarms & dashboards", why: "Logs, metrics, and alarms that page someone before customers notice.", services: ["cloudwatch", "sns"] },
      { added: "VPC endpoints", why: "S3, DynamoDB, ECR, and logs traffic stays on the AWS network and off the NAT bill.", services: ["vpc", "nat-gateway"] }
    ]
  };
})();
