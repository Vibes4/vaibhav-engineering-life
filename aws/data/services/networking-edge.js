/* Networking & edge services — ALB, NLB, API Gateway, CloudFront (schema: _schema.md, template: database.js) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "alb",
  name: "Application Load Balancer",
  shortName: "ALB",
  fullName: "Elastic Load Balancing — Application Load Balancer",
  category: "networking",
  icon: "⚖️",
  tagline: "Layer 7 HTTP/HTTPS load balancer that routes by host/path to ECS, EC2, or Lambda targets",
  whatIsIt: "An Application Load Balancer is the Layer 7 (HTTP/HTTPS) variant of Elastic Load Balancing. It accepts requests on listeners, evaluates rules (host header, path, HTTP header, query string, method, source IP), and forwards each request to a target group of ECS tasks, EC2 instances, IP addresses, or Lambda functions. AWS operates the load balancer nodes in each Availability Zone you enable, terminates TLS with ACM certificates, and continuously health-checks every target.",
  eli5: "Imagine a big shop with one front door and a friendly receptionist. Every visitor tells the receptionist what they want — 'I want to see shoes' or 'I want to pay' — and the receptionist points them to the right counter that is open and not too busy. If a counter closes, the receptionist stops sending people there. The ALB is that receptionist for your website.",
  technical: "An ALB is deployed into at least two subnets in different AZs (each needs a /27 or larger with 8 free IPs); AWS places a load balancer node with an ENI in each enabled AZ and the DNS name resolves to one IP per AZ. Listeners (e.g. 443/HTTPS) hold an ordered rule set whose actions are forward (optionally weighted across target groups), redirect, fixed-response, or authenticate-cognito/authenticate-oidc. Target groups define target type (instance, ip, lambda), protocol/port, protocol version (HTTP/1.1, HTTP/2, gRPC), health checks, stickiness (AWSALB duration cookie or application cookie), deregistration delay, and slow start. TLS is terminated at the ALB with ACM certificates (SNI supports multiple certs per listener); WebSockets and HTTP/2 from clients are supported natively; cross-zone load balancing is on by default.",
  whyUse: [
    "One stable DNS name and TLS endpoint in front of many short-lived ECS tasks whose IPs change on every deploy.",
    "Health checks automatically stop sending traffic to a failing task and resume when it recovers; ECS replaces the task.",
    "Content-based routing: /api/orders and /api/catalog can go to different services from a single listener, and blue/green deploys can weight traffic between two target groups.",
    "TLS termination with ACM (free, auto-renewed certificates) so containers speak plain HTTP inside the VPC.",
    "Native integration with ECS services, Auto Scaling groups, WAF, Cognito/OIDC authentication, and CloudWatch metrics such as TargetResponseTime and HTTPCode_Target_5XX_Count."
  ],
  whenToUse: [
    "Public or internal HTTP/HTTPS APIs and web apps served by ECS/Fargate, EC2, or Lambda.",
    "Microservices that need host- or path-based routing behind one entry point.",
    "WebSocket or HTTP/2/gRPC services (use the gRPC/HTTP2 target group protocol version for gRPC).",
    "Applications that must sit behind AWS WAF or need login enforced at the edge via Cognito/OIDC listener actions.",
    "Zero-downtime deployments using two target groups and weighted forwarding or ECS rolling updates."
  ],
  whenNotToUse: [
    "Non-HTTP protocols (raw TCP, UDP, MQTT, game servers, databases): use a Network Load Balancer (alternative).",
    "You need static IP addresses or Elastic IPs for partner allow-lists: NLB provides one static IP per AZ; if you also need L7 routing put an ALB behind the NLB (ALB is a valid NLB target type).",
    "A purely serverless API that needs API keys, usage plans, request validation, or JWT authorizers with no VPC at all: API Gateway → Lambda is the alternative entry point.",
    "Millions of requests per second with sub-millisecond latency requirements: NLB is closer to the wire and does not parse HTTP.",
    "Exposing a service to other AWS accounts privately via PrivateLink: an endpoint service requires an NLB (or Gateway Load Balancer), not an ALB."
  ],
  placement: {
    scope: "vpc",
    subnet: "public",
    internetAccessible: true,
    summary: "The internet-facing ALB sits in the two public subnets (10.0.1.0/24 and 10.0.2.0/24), one load balancer node per AZ, and forwards to Fargate tasks in the private app subnets. Internal ALBs (scheme = internal) are the same product placed in private subnets for service-to-service traffic.",
    securityGroup: "Required — an ALB always has a security group. Allow inbound 443 (and 80 for the redirect) only from the AWS-managed prefix list com.amazonaws.global.cloudfront.origin-facing when CloudFront is in front (0.0.0.0/0 only if clients hit the ALB directly). Outbound allows the target port (e.g. 8080) to the ECS task security group, and the ECS security group allows inbound 8080 only from the ALB security group.",
    nacl: "The public subnet NACL must allow inbound 80/443 from clients and outbound ephemeral ports 1024–65535 for return traffic, plus outbound to the app subnets on the target port and inbound ephemeral for responses. NACLs are stateless, so both directions must be listed explicitly.",
    routeTable: "Internet-facing ALB subnets need the public route table with 0.0.0.0/0 → Internet Gateway; otherwise clients cannot reach the nodes. An internal ALB only needs the local VPC route.",
    nat: "Not required. The ALB never initiates outbound connections to the internet; it only forwards client requests to targets inside the VPC (or to Lambda via the service API).",
    igw: "Required for an internet-facing ALB (public IPs on its nodes are reachable only through the IGW). Not required for an internal ALB."
  },
  dataFlow: {
    in: [
      "HTTPS requests from CloudFront (or directly from browsers/mobile apps) on the 443 listener; HTTP on 80 that is immediately redirected.",
      "Health-check responses from targets (e.g. GET /health → 200) used to decide which targets receive traffic.",
      "Target registrations/deregistrations from the ECS service scheduler or the Auto Scaling group.",
      "TLS certificates from ACM and an optional WAF web ACL association."
    ],
    out: [
      "Plain HTTP (or HTTPS) requests to ECS task IPs on the target port, with X-Forwarded-For, X-Forwarded-Proto, and X-Forwarded-Port headers added.",
      "JSON invocation events to Lambda functions when the target type is lambda.",
      "Metrics (RequestCount, TargetResponseTime, HTTPCode_ELB_5XX_Count, HealthyHostCount) to CloudWatch and access logs / connection logs to S3.",
      "Responses back to the client, including 502/503/504 generated by the ALB itself when targets fail."
    ]
  },
  networking: [
    "Pick at least two subnets in different AZs; each must be a /27 or larger with at least 8 free IPs for the ALB nodes (they scale by adding ENIs).",
    "Listener 443/HTTPS with an ACM certificate issued in the same Region; listener 80/HTTP whose only rule is a 301 redirect to HTTPS.",
    "Target group of type ip on the container port (e.g. 8080) for Fargate tasks in awsvpc mode; type instance for EC2/Auto Scaling groups; type lambda for functions.",
    "Clients (and CloudFront) use the ALB DNS name via a Route 53 alias record — never the node IPs, which change as the ALB scales.",
    "Idle timeout defaults to 60 seconds; raise it for long-polling or large uploads and keep it below the CloudFront origin response timeout."
  ],
  security: {
    iam: "IAM (elasticloadbalancing:* actions) governs who can create listeners, rules, and target groups. The ECS service-linked role registers task IPs; ALB itself uses the AWSServiceRoleForElasticLoadBalancing service-linked role. Lambda targets need a resource-based policy allowing elasticloadbalancing.amazonaws.com to invoke them.",
    securityGroups: "ALB security group: inbound 443/80 from the CloudFront origin-facing prefix list (or 0.0.0.0/0), outbound to the ECS security group on the container port. ECS security group: inbound only from the ALB security group, so no client can bypass the load balancer.",
    nacl: "Public subnet NACL allows 80/443 in and ephemeral ports out; app subnet NACL allows the container port in from the public subnet CIDRs and ephemeral ports back. Most teams keep default NACLs and enforce with security groups.",
    encryption: "TLS terminated at the ALB using ACM certificates and a modern security policy (e.g. ELBSecurityPolicy-TLS13-1-2-2021-06). Optionally re-encrypt to targets with an HTTPS target group (target certificates are not validated). Enable drop_invalid_header_fields.",
    authentication: "Optional authenticate-cognito or authenticate-oidc listener rule actions force users to log in before the request reaches a target; the ALB forwards identity claims in x-amzn-oidc-* headers.",
    authorization: "Listener rules can allow or deny by path, header, or source IP (fixed-response 403). Fine-grained authorization stays in the application or in WAF rules attached to the ALB.",
    secrets: "No application secrets live on the ALB. A shared secret origin header (e.g. X-Origin-Verify) set by CloudFront and checked by a WAF rule or an ALB rule proves requests came through the CDN; store its value in Secrets Manager and rotate it.",
    leastPrivilege: "Only the deployment pipeline needs elasticloadbalancing:* on this ALB's ARNs; ECS tasks need no ELB permissions. Restrict the security group so the only inbound source is CloudFront."
  },
  iam: [
    "Operators/CI: elasticloadbalancing:CreateLoadBalancer, CreateListener, CreateRule, CreateTargetGroup, ModifyListener, RegisterTargets (scope to ARNs and tags); ec2:Describe* for subnets/SGs.",
    "ECS: the AWSServiceRoleForECS service-linked role needs elasticloadbalancing:RegisterTargets/DeregisterTargets to attach tasks to the target group (created automatically).",
    "ACM: acm:DescribeCertificate/ListCertificates for whoever attaches the certificate; the ALB uses the certificate without any extra role.",
    "Lambda targets: lambda:AddPermission grants principal elasticloadbalancing.amazonaws.com lambda:InvokeFunction, conditioned on the target group ARN.",
    "Access logs: the S3 bucket policy must allow the Region's ELB log delivery account (or logdelivery.elasticloadbalancing.amazonaws.com) to s3:PutObject."
  ],
  scaling: [
    "The ALB scales its own capacity automatically (measured in Load Balancer Capacity Units); it adds node capacity and IPs in each AZ as connections, bytes, and rule evaluations grow.",
    "Very sudden spikes (e.g. a flash sale) can outrun ALB scale-out for a few minutes; use LCU Reservation or ask AWS Support to pre-warm when you can predict the event.",
    "Targets scale independently: ECS Service Auto Scaling target-tracking on ALBRequestCountPerTarget or ECS CPU keeps requests per task steady.",
    "Cross-zone load balancing (on by default for ALB) spreads requests across all healthy targets in every AZ, not just the node's own AZ.",
    "Keep rules and target groups reasonable: each request evaluates the rule list in order, and rule evaluations are one LCU dimension."
  ],
  availability: [
    "Multi-AZ by design: one node per enabled AZ, and the DNS name returns one IP per AZ; if an AZ becomes impaired, its IP is removed from DNS.",
    "Health checks (interval, timeout, healthy/unhealthy thresholds, success codes) deregister failing targets within seconds and re-admit them when they pass again.",
    "If every target in a target group is unhealthy, the ALB fails open and routes to all of them rather than returning 503 for everyone.",
    "Application Recovery Controller zonal shift can move traffic away from a single AZ during a partial outage without redeploying.",
    "Multi-Region needs a separate ALB per Region behind Route 53 failover or latency routing, or CloudFront origin groups."
  ],
  cost: [
    "Hourly charge per ALB (roughly a few cents per hour), billed whether or not traffic flows — consolidate services onto one ALB with path/host rules.",
    "LCU-hours: the highest of new connections/sec, active connections/min, processed bytes, and rule evaluations/sec each hour.",
    "Public IPv4 addresses on the ALB nodes are billed per hour per address.",
    "Data processed to targets in another AZ is free for ALB (unlike NLB cross-zone), but data transfer out to the internet is charged unless CloudFront sits in front (CloudFront→ALB fetches are free).",
    "Access logs cost only S3 storage; WAF, if attached, is billed separately per web ACL, rule, and million requests."
  ],
  commonMistakes: [
    "Opening the ALB security group to 0.0.0.0/0 while CloudFront is in front, letting attackers bypass WAF and caching by calling the ALB DNS name directly.",
    "Putting the ALB in only one subnet/AZ, or in private subnets while expecting it to be internet-facing.",
    "Health check path that requires authentication or hits the database, so a slow DB marks every task unhealthy and the ALB fails open under load.",
    "Leaving the 300-second default deregistration delay, which makes ECS rolling deploys take 5+ minutes per batch.",
    "Using a target group of type instance with Fargate (awsvpc requires type ip), or the wrong container port.",
    "Hard-coding ALB node IPs in DNS or client config instead of a Route 53 alias to the ALB DNS name.",
    "Idle timeout shorter than the app's slowest request, producing 504 Gateway Timeout errors that look like application bugs."
  ],
  bestPractices: [
    "Internet-facing ALB in the two public subnets; ECS tasks in private app subnets whose security group admits only the ALB security group.",
    "Restrict inbound to the CloudFront origin-facing managed prefix list and verify a secret origin header with WAF (or a listener rule).",
    "HTTPS-only: 80 → 443 redirect, ACM certificate, TLS 1.2+/1.3 security policy, drop invalid header fields.",
    "Lightweight /health endpoint returning 200 quickly; health-check interval 10–15 s with unhealthy threshold 2–3; deregistration delay 30–60 s.",
    "Enable access logs to S3 and alarm on HTTPCode_ELB_5XX_Count, HTTPCode_Target_5XX_Count, TargetResponseTime p99, and UnHealthyHostCount.",
    "Use ECS target-tracking on ALBRequestCountPerTarget so the fleet grows before latency does.",
    "Enable deletion protection and manage listeners/rules in Terraform or CloudFormation, not by hand."
  ],
  creationSteps: [
    "Open the AWS Console and go to EC2 → Load Balancers → Create load balancer → Application Load Balancer.",
    "Name it shop-alb, choose Scheme = Internet-facing and IP address type = IPv4.",
    "Select your VPC (10.0.0.0/16) and tick both public subnets (10.0.1.0/24 in AZ a, 10.0.2.0/24 in AZ b).",
    "Create a security group alb-sg allowing inbound 443 and 80 from the com.amazonaws.global.cloudfront.origin-facing prefix list (or 0.0.0.0/0 for testing).",
    "Under Listeners add HTTPS:443 and click 'Create target group': type IP addresses, protocol HTTP, port 8080, VPC 10.0.0.0/16, health check path /health.",
    "Do not register targets manually — the ECS service will register task IPs; finish creating the target group and select it as the 443 default action.",
    "Choose the ACM certificate for api.shop.example (issued in this Region) and the ELBSecurityPolicy-TLS13-1-2-2021-06 security policy.",
    "Add a second listener HTTP:80 with default action Redirect to HTTPS:443, status code 301.",
    "Optionally attach a WAF web ACL under Add-on services, then click Create load balancer.",
    "Edit the ECS task security group to allow inbound 8080 only from alb-sg, and point the ECS service at the new target group.",
    "Create a Route 53 alias record api.shop.example → the ALB DNS name and test https://api.shop.example/health."
  ],
  productionRecommendations: [
    "Two public subnets in two AZs; deletion protection on; access logs to S3.",
    "Inbound limited to the CloudFront prefix list plus an origin secret header check in WAF.",
    "80 → 443 redirect, ACM cert, TLS 1.3-capable security policy.",
    "Fast health checks with a deregistration delay of 30–60 s for quick, safe deploys.",
    "CloudWatch alarms on 5XX counts, p99 TargetResponseTime, and UnHealthyHostCount per AZ.",
    "Weighted target groups or ECS deployment circuit breaker for blue/green and automatic rollback."
  ],
  configExample: {
    title: "Terraform — HTTPS listener with ACM cert, HTTP→HTTPS redirect, IP target group + health check",
    lang: "hcl",
    code: `# aws_lb.app = internet-facing ALB in public subnets 10.0.1.0/24 + 10.0.2.0/24 (SG: 443 from CloudFront prefix list)
resource "aws_lb_target_group" "api" {
  name        = "shop-api-tg"
  port        = 8080
  protocol    = "HTTP"
  target_type = "ip"                 # Fargate tasks (awsvpc) register by private IP
  vpc_id      = aws_vpc.main.id
  deregistration_delay = 30
  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 15
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.app.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.api.arn   # ACM cert in the ALB's Region
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}

resource "aws_lb_listener" "http" {                  # 80 -> 443 redirect
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}`
  },
  productionChecklist: [
    "ALB spans two public subnets in different AZs.",
    "Security group allows 443/80 only from the CloudFront origin-facing prefix list (or intended clients).",
    "HTTP:80 listener only redirects to HTTPS:443.",
    "ACM certificate attached; TLS 1.2+ security policy; invalid header fields dropped.",
    "Target group type ip on the container port; ECS security group admits only alb-sg.",
    "Health check path is cheap, unauthenticated, and returns 200; deregistration delay ≤ 60 s.",
    "WAF web ACL attached (on the ALB or on CloudFront) with an origin secret header rule.",
    "Access logs enabled to S3; alarms on ELB/Target 5XX, TargetResponseTime, UnHealthyHostCount.",
    "Route 53 alias record points at the ALB DNS name.",
    "Deletion protection enabled."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "The ALB and its nodes live inside subnets of a VPC." },
    { id: "subnets", kind: "required", why: "At least two subnets in different AZs (public for internet-facing) with free IPs for the nodes." },
    { id: "security-groups", kind: "required", why: "An ALB always has a security group; it also references the ECS task security group." },
    { id: "route-tables", kind: "required", why: "Internet-facing ALB subnets need the 0.0.0.0/0 → IGW route." },
    { id: "igw", kind: "required", why: "Public clients (and CloudFront) reach the ALB nodes through the Internet Gateway." },
    { id: "ecs", kind: "recommended", why: "The primary target: the ECS service registers Fargate task IPs in the target group." },
    { id: "cloudfront", kind: "recommended", why: "Fronts the ALB for caching, TLS at the edge, WAF, and cheaper egress." },
    { id: "cloudwatch", kind: "recommended", why: "Metrics and alarms for 5XX, latency, and unhealthy hosts." },
    { id: "auto-scaling", kind: "recommended", why: "ECS/EC2 scaling on ALBRequestCountPerTarget keeps targets healthy under load." },
    { id: "iam", kind: "recommended", why: "Administrative permissions and the Lambda invoke permission for lambda targets." },
    { id: "ec2", kind: "optional", why: "Instance targets when workloads run on EC2 instead of Fargate." },
    { id: "lambda", kind: "optional", why: "Lambda functions can be ALB targets for HTTP endpoints." },
    { id: "nacl", kind: "optional", why: "Extra stateless filtering on the public subnets." },
    { id: "nlb", kind: "alternative", why: "Use for TCP/UDP, static IPs, or PrivateLink; an ALB can also sit behind an NLB." },
    { id: "api-gateway", kind: "alternative", why: "Alternative entry point for serverless APIs with authorizers, throttling, and usage plans." }
  ],
  related: ["nlb", "api-gateway", "cloudfront", "ecs", "security-groups", "subnets", "auto-scaling"],
  ecommerceRole: "Single HTTPS entry point for the API: CloudFront forwards /api/* to the ALB, which terminates TLS, checks health, and spreads requests across the Fargate tasks running the orders, catalog, and checkout services in the private app subnets across both AZs.",
  failure: {
    title: "ALB fails or a target becomes unhealthy",
    whatHappens: "A single unhealthy task fails its health check (e.g. 3 misses at 15 s intervals) and is deregistered; new requests go only to healthy targets while ECS launches a replacement, so users at most see a few errors or retries. If an entire AZ is impaired, the ALB node IP for that AZ is withdrawn from DNS and cross-zone load balancing keeps routing to targets in the surviving AZ. If every target is unhealthy the ALB fails open and forwards to all targets anyway; if the target group has no registered targets it returns 503, and slow targets yield 504 after the idle timeout. The ALB control plane and nodes are AWS-managed and redundant per AZ; there is no single-instance ALB to 'go down'.",
    awsMechanisms: [
      "Per-target health checks with configurable interval and thresholds; deregistration of failing targets and automatic re-registration when healthy.",
      "One load balancer node per enabled AZ with DNS-based removal of impaired AZs; cross-zone load balancing to healthy targets anywhere.",
      "Fail-open when all targets in a target group are unhealthy; connection draining (deregistration delay) for in-flight requests.",
      "Application Recovery Controller zonal shift to evacuate one AZ; CloudWatch metrics UnHealthyHostCount, HTTPCode_ELB_5XX_Count, TargetConnectionErrorCount."
    ],
    mitigations: [
      "Run at least two tasks per service spread across both AZs so one failure never drops capacity to zero.",
      "Keep health checks fast and dependency-free; enable the ECS deployment circuit breaker so bad deploys roll back instead of marking every task unhealthy.",
      "Make clients (and CloudFront) retry idempotent GETs on 502/503/504; alarm on UnHealthyHostCount and 5XX rates per AZ.",
      "For Regional DR, deploy a second stack in another Region and use Route 53 failover or CloudFront origin groups."
    ]
  },
  beginnerConnectionHint: "CloudFront (or your browser) talks to the ALB over HTTPS; the ALB talks to the ECS containers in the private subnets and reports its numbers to CloudWatch."
},
{
  id: "nlb",
  name: "Network Load Balancer",
  shortName: "NLB",
  fullName: "Elastic Load Balancing — Network Load Balancer",
  category: "networking",
  icon: "🔀",
  tagline: "Layer 4 TCP/UDP/TLS load balancer with static IPs per AZ and ultra-low latency",
  whatIsIt: "A Network Load Balancer is the Layer 4 variant of Elastic Load Balancing. It forwards TCP, UDP, and TLS flows to targets without inspecting HTTP, provides one static IP address (optionally an Elastic IP) per Availability Zone, preserves the client's source IP, and handles millions of connections per second with very low latency. It is also the required front end for PrivateLink endpoint services.",
  eli5: "Think of a mail sorting office with a fixed street address that never changes. Letters arrive and are handed to whichever counter is open, very fast, without anyone opening the envelopes to read what is inside. The address stays the same forever, so partners can write it down and trust it. That is the NLB.",
  technical: "An NLB is created with a subnet mapping per AZ, each getting a static private IP and, for internet-facing NLBs, optionally an Elastic IP you own. Listeners are TCP, UDP, TCP_UDP, or TLS (TLS terminated with ACM certificates, ALPN policies for HTTP/2); each listener has a single default forward action — there are no host/path rules. Target groups are instance, ip (including on-premises IPs reachable over VPN/Direct Connect), or alb; health checks may be TCP, HTTP, or HTTPS. Client IP preservation is always on for instance targets and configurable for IP targets (default off for TCP/TLS IP target groups; Proxy Protocol v2 is the alternative). Cross-zone load balancing is off by default, and security groups can be attached only at creation time.",
  whyUse: [
    "Static IP addresses per AZ (or your own Elastic IPs) so partners, firewalls, and DNS A records can allow-list a fixed address — ALB IPs change.",
    "Load balancing for protocols that are not HTTP: raw TCP, UDP (DNS, syslog, game traffic), MQTT, SMTP, database proxies, gRPC over TCP.",
    "Extreme throughput and latency: NLB does not parse requests and can absorb sudden, volatile traffic without pre-warming.",
    "Source IP preservation so backends see the real client address without X-Forwarded-For headers.",
    "PrivateLink: exposing a service privately to other VPCs/accounts requires an NLB (or Gateway Load Balancer) as the endpoint service front end."
  ],
  whenToUse: [
    "A gRPC or custom TCP microservice (e.g. a real-time inventory feed) where L7 HTTP routing is unnecessary.",
    "Payment or partner integrations that require fixed egress/ingress IPs to allow-list.",
    "Publishing an internal API to other AWS accounts through a PrivateLink endpoint service.",
    "TLS passthrough where the backend must own the certificate, or TLS termination at L4 with ACM when you do not need HTTP features.",
    "Static IPs plus L7 routing: NLB in front with an ALB-type target group forwarding to an ALB."
  ],
  whenNotToUse: [
    "Ordinary HTTP/HTTPS APIs that need path/host routing, redirects, sticky cookies, WAF, or Cognito/OIDC login: use an Application Load Balancer (alternative).",
    "Serverless APIs needing authorizers, API keys, or throttling: API Gateway is the alternative entry point.",
    "You want request-level metrics (per-path latency, HTTP status codes): NLB only sees flows; use ALB or CloudFront + ALB.",
    "Cost-sensitive multi-AZ traffic with cross-zone balancing: NLB charges for cross-AZ data processing while ALB does not.",
    "Content caching or global TLS termination: that is CloudFront's job, not a load balancer's."
  ],
  placement: {
    scope: "vpc",
    subnet: "public",
    internetAccessible: true,
    summary: "OPTIONAL / ALTERNATIVE in the reference architecture. An internet-facing NLB would sit in the public subnets (10.0.1.0/24, 10.0.2.0/24) with one Elastic IP per AZ and forward TCP flows to Fargate task IPs in the private app subnets; an internal NLB for PrivateLink lives in the private app subnets instead.",
    securityGroup: "Optional. NLBs created since 2023 can have security groups attached at creation time (they cannot be added later); if attached, inbound rules filter client traffic and target security groups can reference the NLB security group. Without one, filtering happens only on the targets, which see the preserved client IP — so the ECS task security group must admit the actual client CIDRs plus the NLB node private IPs (or VPC CIDR) for health checks.",
    nacl: "Public subnet NACL must allow the listener port inbound from clients and ephemeral ports outbound; the app subnet NACL must allow the target port inbound from client CIDRs (source IP is preserved) and from the NLB subnets for health checks.",
    routeTable: "Internet-facing NLB subnets need 0.0.0.0/0 → Internet Gateway. Because client IPs are preserved, target subnets must also have a return path to the internet through the NLB — the NLB handles this, so targets need no IGW route themselves.",
    nat: "Not required. The NLB initiates no outbound internet traffic; return traffic flows back through the NLB.",
    igw: "Required for an internet-facing NLB with Elastic IPs. Not required for an internal NLB (private static IPs only)."
  },
  dataFlow: {
    in: [
      "TCP/UDP/TLS flows from clients (or from VPC endpoint ENIs in consumer accounts for PrivateLink) on the listener port, e.g. TCP 50051 for gRPC.",
      "Health-check responses (TCP connect success or HTTP 200 on a chosen port/path) from targets.",
      "Target registrations from the ECS service scheduler or Auto Scaling group.",
      "Optional ACM certificate for a TLS listener."
    ],
    out: [
      "The same flows forwarded to target IPs/instances on the target port with the original client source IP (or with Proxy Protocol v2 headers if preservation is disabled).",
      "Flow-level metrics (ActiveFlowCount, NewFlowCount, ProcessedBytes, HealthyHostCount, TCP_Target_Reset_Count) to CloudWatch.",
      "Access logs to S3 (available only when the NLB has a TLS listener).",
      "Return packets to clients from the NLB's static IPs."
    ]
  },
  networking: [
    "One subnet mapping per AZ; specify an Elastic IP allocation (internet-facing) or a private IPv4 (internal) if you need predictable addresses.",
    "Listener protocol TCP/UDP/TCP_UDP/TLS on any port 1–65535; TLS listeners need an ACM certificate and optionally an ALPN policy (e.g. HTTP2Preferred for gRPC).",
    "Target groups must use protocol TCP/UDP/TCP_UDP/TLS (or type alb pointing at an ALB); health checks can still be HTTP on a separate port such as 8081.",
    "Health checks originate from the NLB nodes' private IPs, not the client, so target security groups/NACLs must admit those (or the NLB security group).",
    "TCP idle timeout is fixed at 350 s; clients should send keepalives for long-lived connections. Cross-zone load balancing is off by default — enable it if targets are unevenly distributed across AZs."
  ],
  security: {
    iam: "IAM elasticloadbalancing:* actions control creation of the NLB, listeners, and target groups; ec2:AllocateAddress/AssociateAddress for Elastic IPs; ec2:CreateVpcEndpointServiceConfiguration to publish it via PrivateLink.",
    securityGroups: "Attach a security group at creation (recommended) allowing only the listener ports from trusted CIDRs; have the ECS task security group allow the target port from the NLB security group. Without an NLB security group, the target security group is the only filter and must allow real client IPs.",
    nacl: "Stateless rules on both public and app subnets must allow the listener/target port inbound and ephemeral ports outbound; remember client IPs are preserved end to end.",
    encryption: "TLS listener terminates with ACM certificates and a chosen security policy, or use a TCP listener for TLS passthrough so the backend terminates TLS itself. There is no plaintext inspection either way.",
    authentication: "None at the load balancer — NLB has no authentication features. Authenticate in the application (mTLS with passthrough, tokens in gRPC metadata).",
    authorization: "Network-level only: security groups, NACLs, and PrivateLink endpoint acceptance/allowed principals. Application-level authorization stays in the service.",
    secrets: "No secrets are stored on the NLB. TLS private keys live in ACM (or on the backend for passthrough).",
    leastPrivilege: "Grant elasticloadbalancing permissions only to the pipeline, scoped to this NLB's ARNs. For PrivateLink, list only the specific consumer account/role ARNs as allowed principals and require acceptance."
  },
  iam: [
    "Operators/CI: elasticloadbalancing:CreateLoadBalancer/CreateListener/CreateTargetGroup/RegisterTargets and ec2:AllocateAddress for Elastic IPs (scoped by ARN/tag).",
    "ECS service-linked role (AWSServiceRoleForECS) registers/deregisters task IPs in the target group automatically.",
    "TLS listeners: whoever attaches the certificate needs acm:DescribeCertificate; the NLB uses the ACM certificate through the service-linked role.",
    "PrivateLink: ec2:CreateVpcEndpointServiceConfiguration and ec2:ModifyVpcEndpointServicePermissions for the publisher; consumers need ec2:CreateVpcEndpoint.",
    "Access logs (TLS listeners only): S3 bucket policy allowing the ELB log delivery principal to write objects."
  ],
  scaling: [
    "NLB scales automatically to millions of requests per second and handles sudden spikes without pre-warming; capacity is measured in NLCUs (new connections/sec, active connections, processed bytes).",
    "Targets scale independently via ECS Service Auto Scaling or an Auto Scaling group registered with the target group.",
    "Per-AZ capacity: with cross-zone off, each node only uses targets in its own AZ, so keep target counts balanced across AZs or enable cross-zone.",
    "Flow hashing (source IP/port, destination IP/port, protocol) pins a connection to one target; long-lived connections do not rebalance until they reconnect.",
    "Target group stickiness (source IP) keeps a client on the same target across flows when needed."
  ],
  availability: [
    "One NLB node and static IP per enabled AZ; if all targets in an AZ fail health checks, Route 53 stops returning that AZ's IP for the NLB DNS name.",
    "Health checks (TCP/HTTP/HTTPS) remove failing targets from rotation; if every target in every AZ is unhealthy the NLB fails open to all targets.",
    "Cross-zone load balancing (optional) lets a node forward to healthy targets in other AZs, avoiding an AZ with no healthy targets.",
    "Elastic IPs are Region-scoped and survive NLB recreation, so DR runbooks can re-attach the same public IPs.",
    "Multi-Region needs a second NLB with its own IPs plus Route 53 failover; Global Accelerator can provide static anycast IPs in front of NLBs in several Regions."
  ],
  cost: [
    "Hourly charge per NLB plus NLCU-hours based on new connections/sec, active connections, and processed bytes.",
    "Cross-zone load balancing data processing is charged per GB on NLB (free on ALB).",
    "Each public IPv4 / Elastic IP attached is billed per hour.",
    "Data transfer out to the internet from targets via the NLB is billed at standard EC2 rates.",
    "TLS listeners consume more NLCUs than plain TCP; access logs add S3 storage."
  ],
  commonMistakes: [
    "Forgetting that client IP preservation means target security groups must allow the real client CIDRs, not just the NLB — traffic silently fails.",
    "Creating the NLB without a security group and discovering one cannot be added later.",
    "Leaving cross-zone load balancing off with all tasks in one AZ, so one node has zero healthy targets and clients hitting that IP fail.",
    "Health-checking a TCP port that accepts connections even when the app is broken; use an HTTP health check on a readiness endpoint.",
    "Expecting path-based routing, redirects, or WAF — NLB has none; that is ALB.",
    "Hairpinning: an instance target with client IP preservation cannot connect to itself through the NLB (source and destination IP are the same).",
    "Ignoring the fixed 350 s TCP idle timeout, causing long-lived connections to be reset without keepalives."
  ],
  bestPractices: [
    "Attach a security group at creation and reference it from the target security group; allocate Elastic IPs per AZ if partners need allow-lists.",
    "Use HTTP/HTTPS health checks against a readiness endpoint, not a bare TCP check.",
    "Enable cross-zone load balancing when target counts per AZ are uneven (accept the small data charge).",
    "Terminate TLS on the NLB with ACM when you only need L4 features; use TLS passthrough when the backend must own the certificate (mTLS).",
    "Alarm on UnHealthyHostCount, TCP_ELB_Reset_Count, and TCP_Target_Reset_Count; enable access logs on TLS listeners.",
    "For PrivateLink, require acceptance and restrict allowed principals; document the endpoint service name for consumers.",
    "Prefer ALB for HTTP APIs; adopt NLB only when static IPs, non-HTTP protocols, or PrivateLink genuinely demand it."
  ],
  creationSteps: [
    "Open the AWS Console and go to EC2 → Load Balancers → Create load balancer → Network Load Balancer.",
    "Name it shop-grpc-nlb, choose Scheme = Internet-facing (or Internal for PrivateLink), IP address type IPv4.",
    "Select the VPC (10.0.0.0/16) and map the two public subnets (10.0.1.0/24, 10.0.2.0/24); for each, choose 'Use an Elastic IP address' and pick a pre-allocated EIP.",
    "Attach a security group nlb-sg allowing inbound TCP 50051 from your partner CIDRs (this can only be done now, not later).",
    "Under Listeners add TCP:50051 and click 'Create target group': type IP addresses, protocol TCP, port 50051, VPC 10.0.0.0/16.",
    "Set the health check to HTTP, port override 8081, path /healthz, then finish creating the target group without registering targets (ECS will).",
    "Back in the wizard select the target group as the listener's default action and click Create load balancer.",
    "Edit the ECS task security group to allow TCP 50051 from nlb-sg (and, if client IP preservation is on, from the client CIDRs) and 8081 from nlb-sg for health checks.",
    "Point the ECS service at the target group and wait for targets to show 'healthy'.",
    "Optionally enable cross-zone load balancing under Attributes, then create a Route 53 alias record grpc.shop.example → the NLB DNS name.",
    "Test from a client: connect to the Elastic IP or DNS name on port 50051 and confirm the backend logs the client's real IP."
  ],
  productionRecommendations: [
    "Two AZs with an Elastic IP each; security group attached at creation.",
    "HTTP health checks on a readiness endpoint; deregistration delay tuned to connection lifetimes.",
    "Cross-zone load balancing on unless targets are guaranteed balanced per AZ.",
    "TLS via ACM on the listener or explicit passthrough — decide deliberately.",
    "Alarms on unhealthy hosts and TCP reset counts; access logs if TLS.",
    "Keep an ALB as the default for HTTP; use NLB → ALB only when static IPs and L7 routing are both required."
  ],
  configExample: {
    title: "Terraform — internet-facing NLB with Elastic IPs, TCP listener and IP target group",
    lang: "hcl",
    code: `resource "aws_lb" "grpc" {
  name               = "shop-grpc-nlb"
  load_balancer_type = "network"
  security_groups    = [aws_security_group.nlb.id]   # optional; can only be set at creation
  subnet_mapping {
    subnet_id     = aws_subnet.public_a.id            # 10.0.1.0/24
    allocation_id = aws_eip.nlb_a.id                  # static IP for partner allow-lists
  }
  subnet_mapping {
    subnet_id     = aws_subnet.public_b.id            # 10.0.2.0/24
    allocation_id = aws_eip.nlb_b.id
  }
}

resource "aws_lb_target_group" "grpc" {
  name               = "shop-grpc-tg"
  port               = 50051
  protocol           = "TCP"
  target_type        = "ip"                           # Fargate task IPs
  vpc_id             = aws_vpc.main.id
  preserve_client_ip = true
  health_check {
    protocol = "HTTP"                                 # L4 LB, but health check can be HTTP
    port     = "8081"
    path     = "/healthz"
  }
}

resource "aws_lb_listener" "grpc" {
  load_balancer_arn = aws_lb.grpc.arn
  port              = 50051
  protocol          = "TCP"                           # or "TLS" with certificate_arn
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.grpc.arn
  }
}`
  },
  productionChecklist: [
    "NLB mapped to two subnets in different AZs (Elastic IP per AZ if allow-listing is needed).",
    "Security group attached at creation; target security group references it.",
    "Target security group also admits real client CIDRs when client IP preservation is on.",
    "Health check uses HTTP/HTTPS on a readiness endpoint, not bare TCP.",
    "Cross-zone load balancing decision made explicitly and documented.",
    "TLS listener uses an ACM certificate with a current security policy, or passthrough is intentional.",
    "CloudWatch alarms on UnHealthyHostCount and TCP reset counts.",
    "Access logs enabled (TLS listeners) to S3.",
    "PrivateLink endpoint service (if used) requires acceptance and lists allowed principals.",
    "Route 53 alias record points to the NLB DNS name; deletion protection enabled."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "NLB nodes live in subnets of a VPC." },
    { id: "subnets", kind: "required", why: "One subnet per AZ for the subnet mappings and static IPs." },
    { id: "route-tables", kind: "required", why: "Internet-facing NLB subnets need the 0.0.0.0/0 → IGW route." },
    { id: "igw", kind: "required", why: "Elastic IPs on the NLB are reachable only through the Internet Gateway (internal NLBs do not need it)." },
    { id: "security-groups", kind: "recommended", why: "Attach at creation to filter clients; target security groups must admit NLB health checks and preserved client IPs." },
    { id: "ecs", kind: "recommended", why: "Fargate tasks are the usual IP targets for a gRPC/TCP service." },
    { id: "cloudwatch", kind: "recommended", why: "Flow metrics and unhealthy host alarms." },
    { id: "iam", kind: "recommended", why: "Administrative permissions, Elastic IP allocation, PrivateLink service configuration." },
    { id: "ec2", kind: "optional", why: "Instance targets when workloads run on EC2." },
    { id: "nacl", kind: "optional", why: "Stateless subnet filtering; must allow preserved client IPs." },
    { id: "alb", kind: "alternative", why: "Preferred for HTTP/HTTPS; can also be an NLB target when static IPs plus L7 routing are required." },
    { id: "api-gateway", kind: "alternative", why: "Serverless HTTP entry point; REST API VPC Links actually target an NLB." }
  ],
  related: ["alb", "api-gateway", "cloudfront", "ecs", "security-groups", "subnets"],
  ecommerceRole: "OPTIONAL / ALTERNATIVE: not needed for the HTTP API behind the ALB. It would front a gRPC or raw-TCP service (e.g. a real-time inventory stream) or provide fixed Elastic IPs for a payment partner's allow-list; it could also publish the internal API to another account via PrivateLink.",
  failure: {
    title: "NLB target fails",
    whatHappens: "When a target stops answering health checks it is marked unhealthy and receives no new flows; existing TCP connections to it are terminated (the default for new target groups) so clients reconnect and land on a healthy target. If every target in one AZ is unhealthy and cross-zone balancing is off, that AZ's static IP is withdrawn from the NLB's DNS answers and clients resolving the DNS name move to the other AZ — but clients hard-coded to that Elastic IP keep failing until targets recover. If all targets everywhere are unhealthy the NLB fails open and forwards to all of them. The NLB nodes themselves are AWS-managed and redundant per AZ.",
    awsMechanisms: [
      "TCP/HTTP/HTTPS health checks that deregister failing targets and re-admit them when healthy; configurable termination of connections to unhealthy targets.",
      "DNS-level zonal failover: an AZ with no healthy targets is removed from the NLB DNS name (cross-zone off), or cross-zone load balancing forwards to other AZs.",
      "Fail-open when all targets are unhealthy; deregistration delay for draining connections.",
      "CloudWatch metrics UnHealthyHostCount, TCP_Target_Reset_Count, TCP_ELB_Reset_Count and Application Recovery Controller zonal shift support."
    ],
    mitigations: [
      "Run targets in both AZs and enable cross-zone load balancing so a single-AZ failure never strands one static IP.",
      "Have clients use the DNS name (short TTL) rather than a single Elastic IP where possible, and implement reconnect with backoff for long-lived connections.",
      "Use readiness-style HTTP health checks so half-broken tasks are removed quickly; let ECS replace failed tasks.",
      "Alarm on UnHealthyHostCount per AZ and on rising TCP reset counts; test AZ failure with fault injection."
    ]
  },
  beginnerConnectionHint: "Partners or gRPC clients connect to the NLB's fixed IP addresses; the NLB passes the connection straight to your containers without reading it, and reports how many connections it sees to CloudWatch."
},
{
  id: "api-gateway",
  name: "Amazon API Gateway",
  shortName: "API Gateway",
  fullName: "Amazon API Gateway",
  category: "networking",
  icon: "🚪",
  tagline: "Fully managed front door for REST, HTTP, and WebSocket APIs — usually in front of Lambda",
  whatIsIt: "Amazon API Gateway is a fully managed service for publishing, securing, throttling, and monitoring APIs. It receives HTTPS requests, applies authorizers, throttling, and optional caching, then invokes a backend integration — most often a Lambda function, but also any HTTP endpoint, AWS service, or private resources in your VPC through a VPC Link. It offers REST APIs, lower-cost HTTP APIs, and WebSocket APIs.",
  eli5: "Picture a ticket booth at the entrance of a theme park. Everyone has to stop there first: the booth checks your ticket, makes sure not too many people rush in at once, and then tells you which ride to go to. The people running the rides never have to check tickets themselves. API Gateway is that booth for your app's requests.",
  technical: "API Gateway is a Regional AWS-managed service reached at an execute-api endpoint or a custom domain. REST APIs (v1) model resources/methods with integrations (Lambda proxy or non-proxy, HTTP, AWS service, Mock, VPC Link to an NLB), stages with stage variables, canary deployments, per-method throttling, API keys and usage plans, request validation, a per-stage cache (0.5–237 GB), and endpoint types edge-optimized, regional, or private (via an execute-api interface endpoint plus a resource policy). HTTP APIs (v2) are cheaper and lower-latency with JWT, Lambda, or IAM authorizers, built-in CORS, automatic deployments, and VPC Links to ALB/NLB/Cloud Map, but without usage plans, caching, request validation, or WAF. WebSocket APIs manage persistent connections with $connect/$disconnect/$default routes and a callback API for server push. Integration timeout is 29 seconds by default; the Regional account-level throttle defaults to 10,000 requests/second with a 5,000 burst.",
  whyUse: [
    "A serverless HTTPS front door for Lambda with no load balancer, VPC, or servers to manage — you pay per request.",
    "Built-in authentication: Cognito user pool / JWT authorizers validate tokens before your code runs; Lambda authorizers handle custom schemes; IAM auth for service-to-service.",
    "Throttling and quotas per stage, route, or API key protect Lambda concurrency and downstream databases from bursts and abusive clients.",
    "Usage plans and API keys let you meter and tier partner access (REST APIs).",
    "Request validation, response caching, stages (dev/staging/prod), canary releases, and access logs/X-Ray tracing out of the box."
  ],
  whenToUse: [
    "Serverless APIs where each route is a Lambda function (e.g. the promo-code validation or webhook receivers of the shop).",
    "Public developer/partner APIs that need API keys, quotas, and per-client throttling.",
    "Token-based auth at the edge with Cognito/OIDC JWTs so backend code trusts already-validated claims.",
    "Real-time features (order status push, live chat) via WebSocket APIs backed by Lambda and DynamoDB connection tables.",
    "Combining with containers when you need its features in front of ECS: API Gateway → VPC Link → private ALB/NLB → ECS."
  ],
  whenNotToUse: [
    "A container-based HTTP API that just needs routing, TLS, and health checks: an Application Load Balancer is the simpler, cheaper alternative entry point (ALB → ECS).",
    "Very high, steady request volumes where per-request pricing exceeds a flat ALB bill — ALB (or ALB with Lambda targets) is the alternative.",
    "Long-running requests: the integration timeout is 29 seconds by default; use asynchronous patterns (SQS, Step Functions) or an ALB with a longer idle timeout.",
    "Raw TCP/UDP or non-HTTP protocols: Network Load Balancer is the alternative.",
    "Static content delivery: serve from S3 through CloudFront rather than through an API."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: true,
    summary: "API Gateway is an AWS-managed Regional service that lives outside your VPC; clients reach its public execute-api endpoint or custom domain. It is an ALTERNATIVE entry point to the ALB in the reference architecture (API Gateway → Lambda for serverless routes), not a layer in front of it.",
    securityGroup: "Not applicable to the API itself — it is not an ENI in your VPC. Security groups matter only for a VPC Link (its ENIs get a security group) and for the ALB/NLB/ECS targets it reaches.",
    nacl: "Not applicable to the API endpoint. NACLs on the subnets hosting VPC Link ENIs or a private execute-api interface endpoint must allow 443 and ephemeral return traffic.",
    routeTable: "Not applicable for public APIs. Private APIs are reached through an execute-api interface endpoint in your subnets (local VPC route only); VPC Links reach private ALB/NLB targets over the VPC local route.",
    nat: "Not required for API Gateway. A Lambda function behind it that is attached to the VPC needs a NAT Gateway (or VPC endpoints) to call AWS APIs or the internet.",
    igw: "Not required. Traffic from the internet terminates at the AWS-managed endpoint, not in your VPC.",
    vpcOptional: "Optional: (1) VPC Link — REST APIs link to an NLB; HTTP APIs link to an ALB, NLB, or Cloud Map service in your private subnets, so API Gateway can front private ECS services. (2) Private REST API — endpoint type PRIVATE reachable only via an execute-api interface VPC endpoint, locked down with a resource policy. (3) Lambda integrations run outside your VPC unless the function is VPC-attached."
  },
  dataFlow: {
    in: [
      "HTTPS requests from browsers, mobile apps, or partners at the custom domain (api.shop.example) or execute-api endpoint, optionally via CloudFront.",
      "Bearer tokens (Cognito/OIDC JWTs), IAM SigV4 signatures, or API keys evaluated by authorizers and usage plans.",
      "WebSocket frames from connected clients routed by the route selection expression.",
      "Backend responses from Lambda (statusCode/headers/body JSON), HTTP integrations, or AWS service integrations."
    ],
    out: [
      "Invocation events to Lambda (proxy payload with method, path, headers, query, body) or HTTP requests to VPC Link / public backends.",
      "Responses to clients, including gateway-generated 401/403 (auth), 429 (throttled), 502 (bad integration response), 504 (integration timeout).",
      "Access logs and execution logs to CloudWatch Logs, metrics (Count, 4XXError, 5XXError, Latency, IntegrationLatency) to CloudWatch, traces to X-Ray.",
      "Server-push messages to WebSocket connections via the @connections management API."
    ]
  },
  networking: [
    "Clients use HTTPS only (TLS 1.2+); a custom domain needs an ACM certificate in the same Region for regional endpoints or in us-east-1 for edge-optimized ones, plus a Route 53 alias to the API Gateway domain.",
    "Regional endpoint type is recommended when CloudFront already sits in front; edge-optimized adds a second AWS-managed CloudFront layer.",
    "VPC Link (HTTP API) creates ENIs in the subnets you choose with a security group; the private ALB/NLB security group must allow 80/443 from that security group.",
    "Private REST APIs require an execute-api interface endpoint (private DNS enabled) and a resource policy allowing only that VPC endpoint.",
    "Optional mutual TLS on custom domains with a truststore in S3; account-level throttle 10,000 rps / 5,000 burst per Region by default (raise via quota request)."
  ],
  security: {
    iam: "apigateway:* actions for operators/CI. API Gateway invokes Lambda through a resource-based policy on the function (principal apigateway.amazonaws.com, conditioned on the API's execute-api ARN). REST APIs need an account-level CloudWatch Logs role to write logs.",
    securityGroups: "Not applicable to the endpoint; applies only to VPC Link ENIs and to the private ALB/NLB/ECS tasks behind them, which should admit traffic only from the VPC Link security group.",
    nacl: "Not applicable to the endpoint; standard subnet NACLs cover VPC Link ENIs or the execute-api interface endpoint.",
    encryption: "TLS 1.2+ enforced for all client connections; ACM manages custom domain certificates. Optional encrypted stage cache (REST). Payloads to Lambda travel over AWS-internal TLS.",
    authentication: "Cognito user pool authorizer or JWT authorizer (any OIDC issuer) validates tokens; Lambda authorizer for custom tokens or API keys; IAM/SigV4 auth for AWS principals. API keys alone are not authentication — pair them with an authorizer.",
    authorization: "JWT scopes/claims checked per route; Lambda authorizers return IAM-style policies or simple allow/deny (cached by TTL); resource policies restrict by source VPC endpoint, IP, or account; usage plans limit what a key may call.",
    secrets: "API Gateway stores no application secrets. Lambda authorizer secrets (e.g. HMAC keys) belong in Secrets Manager or SSM Parameter Store; never in stage variables, which are visible in the console and logs.",
    leastPrivilege: "Each Lambda function's resource policy should allow only its own API/stage/method ARN. Scope apigateway:* to specific API IDs for the pipeline; grant execute-api:Invoke to callers only for the routes they need."
  },
  iam: [
    "Operators/CI: apigateway:POST/PUT/PATCH/DELETE on the API and stage ARNs, plus lambda:AddPermission to wire integrations (SAM/CDK do this automatically).",
    "Lambda integration: resource-based policy on the function granting lambda:InvokeFunction to apigateway.amazonaws.com with SourceArn = arn:aws:execute-api:REGION:ACCOUNT:API_ID/*/GET/orders.",
    "Lambda authorizer: same invoke permission for the authorizer function, or an explicit invocation role assumed by API Gateway.",
    "Logging (REST): account setting cloudWatchRoleArn pointing to a role with AmazonAPIGatewayPushToCloudWatchLogs; access logs also need a log group resource policy for HTTP APIs in some setups.",
    "IAM-authenticated callers: execute-api:Invoke on the specific method ARNs; private APIs add a resource policy allowing aws:SourceVpce."
  ],
  scaling: [
    "Fully managed and horizontally scaled by AWS; you set the ceilings — account-level throttle (default 10,000 rps, 5,000 burst per Region), then stage/route throttles below it.",
    "Backend Lambda scales per invocation; align route throttles with the function's reserved concurrency to avoid 429s turning into Lambda throttles.",
    "REST stage cache (0.5–237 GB) absorbs repeated GETs so backends and databases see fewer calls; HTTP APIs have no cache — put CloudFront in front instead.",
    "Usage plans give per-API-key rate/burst and daily/monthly quotas so one partner cannot consume everyone's capacity.",
    "WebSocket APIs scale connections independently; connection state is yours to persist (typically DynamoDB)."
  ],
  availability: [
    "Regional service deployed across multiple AZs by AWS; there is nothing for you to make Multi-AZ.",
    "Backend failures surface as 502/504; API Gateway does not retry synchronous Lambda invocations, so clients should retry idempotent calls with backoff.",
    "Stages and canary deployments let you shift a percentage of traffic to a new deployment and roll back instantly.",
    "Multi-Region: deploy the API and Lambda in a second Region with the same custom domain and use Route 53 failover/latency records or CloudFront origin groups.",
    "Cached responses (REST) and CloudFront caching can keep read paths serving while a backend is degraded."
  ],
  cost: [
    "Per million requests: HTTP APIs cost roughly a third of REST APIs; WebSocket APIs bill per million messages plus connection-minutes.",
    "REST stage caching is billed hourly by cache size regardless of hit rate.",
    "Data transfer out to the internet per GB at standard rates; for most APIs the request count, not bandwidth, dominates the bill.",
    "Lambda invocations and duration behind the API are billed separately, as are CloudWatch Logs ingestion for access/execution logs.",
    "VPC Links (HTTP API) are free; REST VPC Links rely on an NLB you pay for hourly."
  ],
  commonMistakes: [
    "Chaining CloudFront → API Gateway → ALB → ECS 'because more layers is safer' when API Gateway adds nothing; pick ALB → ECS or API Gateway → Lambda deliberately.",
    "Relying on API keys as authentication; keys are for metering and can leak from client apps.",
    "Returning a non-conforming Lambda proxy response (missing statusCode or non-string body) and getting an opaque 502 'Internal server error'.",
    "Forgetting to deploy the REST API stage after changes (HTTP APIs auto-deploy; REST APIs do not by default).",
    "Leaving execution logging at INFO with full request/response bodies in production, leaking PII into CloudWatch Logs and inflating cost.",
    "No per-route throttle, so one abusive client hits the account-level limit and 429s every other API in the Region.",
    "Using edge-optimized endpoints behind your own CloudFront distribution, doubling the CDN hops and confusing Host headers."
  ],
  bestPractices: [
    "Choose HTTP APIs by default for Lambda backends; use REST APIs only when you need usage plans, caching, request validation, WAF, or private endpoints.",
    "Always attach an authorizer (Cognito/JWT/Lambda/IAM) to every non-public route; treat API keys as billing identifiers only.",
    "Set stage and per-route throttles below the account limit and below Lambda reserved concurrency.",
    "Use a regional endpoint with a custom domain and ACM certificate; put CloudFront + WAF in front if you need caching, geo rules, or edge protection.",
    "Enable access logs in JSON to CloudWatch Logs with requestId, status, integration latency, and caller identity; alarm on 5XXError and Latency p99.",
    "Define the API in SAM/CDK/OpenAPI so stages are reproducible; use canary deployments for REST APIs.",
    "Make Lambda handlers idempotent and instruct clients to retry 429/5xx with exponential backoff and jitter."
  ],
  creationSteps: [
    "Open the AWS Console and go to API Gateway → Create API → HTTP API → Build.",
    "Add an integration: choose Lambda, select the Region and the get-orders function, and name the API shop-http-api.",
    "Configure routes: method GET, resource path /orders, integration target get-orders.",
    "Define stages: keep $default with Auto-deploy on (or create prod), then click Create.",
    "Open Authorization → Create and attach an authorizer: type JWT, identity source $request.header.Authorization, issuer URL of your Cognito user pool, audience = the app client id; attach it to GET /orders.",
    "Under Throttling set the stage default route throttling (e.g. 100 rps, 200 burst) below your Lambda reserved concurrency.",
    "Under CORS configure allowed origins (https://www.shop.example), headers, and methods if browsers call the API directly.",
    "Go to Custom domain names → Create: api.shop.example with a Regional ACM certificate, then add an API mapping to shop-http-api stage $default.",
    "In Route 53 create an alias A record for api.shop.example pointing to the API Gateway regional domain name.",
    "Under Monitor → Logging enable access logs to a CloudWatch log group using a JSON format.",
    "Test with curl: an unauthenticated call returns 401; a call with a valid Cognito JWT in the Authorization header returns your orders payload."
  ],
  productionRecommendations: [
    "HTTP API with a JWT/Cognito authorizer on every private route; regional endpoint with a custom domain.",
    "Stage and route throttles configured; Lambda reserved concurrency set to protect RDS/DynamoDB.",
    "Access logs to CloudWatch Logs; alarms on 5XXError, 4XXError spikes, IntegrationLatency p99.",
    "Defined in SAM/CDK, deployed via CI with separate dev/staging/prod stages or APIs.",
    "CloudFront + WAF in front when exposed publicly at scale (WAF attaches directly only to REST stages).",
    "Clear decision documented: API Gateway → Lambda routes vs. ALB → ECS routes; combine only through VPC Link when its features are needed for containers."
  ],
  configExample: {
    title: "SAM — HTTP API with Cognito JWT authorizer and a Lambda route",
    lang: "yaml",
    code: `AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

Resources:
  OrdersHttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      StageName: prod
      Auth:
        DefaultAuthorizer: CognitoJwt
        Authorizers:
          CognitoJwt:
            IdentitySource: "$request.header.Authorization"
            JwtConfiguration:
              issuer: https://cognito-idp.eu-west-1.amazonaws.com/eu-west-1_EXAMPLE
              audience:
                - 1a2b3c4d5e6f7g8h9i0jklmnop          # Cognito app client id
      DefaultRouteSettings:
        ThrottlingRateLimit: 100                     # requests/second per stage
        ThrottlingBurstLimit: 200

  GetOrdersFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: nodejs20.x
      Handler: orders.getHandler
      CodeUri: src/
      Timeout: 10
      Events:
        GetOrders:
          Type: HttpApi                                 # SAM adds the lambda:InvokeFunction permission
          Properties:
            ApiId: !Ref OrdersHttpApi
            Path: /orders
            Method: GET`
  },
  productionChecklist: [
    "Every non-public route has a JWT/Cognito, Lambda, or IAM authorizer.",
    "Stage/route throttling set below account limits and Lambda reserved concurrency.",
    "Custom domain with ACM certificate (Regional) and Route 53 alias; TLS 1.2 minimum.",
    "Access logging to CloudWatch Logs in JSON; execution logging not leaking bodies in prod.",
    "Alarms on 5XXError, 4XXError rate, Latency/IntegrationLatency p99, and throttle counts.",
    "Lambda resource policies scoped to this API's execute-api ARN.",
    "CORS configured to explicit origins, not *.",
    "Usage plans/API keys (REST) only for metering, never as the sole auth.",
    "WAF (REST stage or CloudFront) in front of public APIs.",
    "Infrastructure defined in SAM/CDK/Terraform; stages deployed via CI."
  ],
  dependencies: [
    { id: "lambda", kind: "recommended", why: "The canonical backend: Lambda proxy integration per route." },
    { id: "iam", kind: "required", why: "Resource policies letting API Gateway invoke Lambda; execute-api:Invoke for IAM-authenticated callers; logging role." },
    { id: "cloudwatch", kind: "recommended", why: "Access/execution logs, metrics, and alarms on errors, latency, and throttling." },
    { id: "cloudfront", kind: "optional", why: "Edge caching, WAF, and a single domain fronting both the API and static assets." },
    { id: "dynamodb", kind: "optional", why: "Typical serverless data store behind Lambda routes and for WebSocket connection tables." },
    { id: "vpc", kind: "optional", why: "Only needed for VPC Links to private ALB/NLB targets or private REST APIs via an interface endpoint." },
    { id: "nlb", kind: "optional", why: "REST API VPC Links target an NLB in front of private ECS services." },
    { id: "sqs", kind: "optional", why: "Direct AWS service integration to enqueue work asynchronously instead of a synchronous Lambda." },
    { id: "step-functions", kind: "optional", why: "Start workflows directly from an API route (StartExecution service integration)." },
    { id: "alb", kind: "alternative", why: "Alternative entry point for container APIs (ALB → ECS); combine only via VPC Link when API Gateway features are needed." }
  ],
  related: ["alb", "lambda", "cloudfront", "nlb", "authorization", "sqs", "step-functions"],
  ecommerceRole: "ALTERNATIVE serverless entry point: routes such as promo-code validation, payment webhooks, and the WebSocket order-status feed go API Gateway → Lambda, while the main catalog/checkout API goes CloudFront → ALB → ECS. Both are exposed under the same CloudFront domain via path patterns.",
  failure: {
    title: "API Gateway throttles or the backend integration fails",
    whatHappens: "When requests exceed the stage, route, usage-plan, or account throttle, API Gateway returns 429 Too Many Requests immediately without invoking the backend — the backend is protected but clients see errors until they back off. When the integration fails, the gateway returns 502 (Lambda threw, was throttled, or returned a malformed proxy response), 504 (integration exceeded the 29-second timeout), or passes through the backend's own 5xx. API Gateway does not retry synchronous integrations, so every failure reaches the caller unless a cached (REST) or CloudFront-cached response can be served. The service itself is Regional and AWS-managed; a Regional outage requires your own multi-Region failover.",
    awsMechanisms: [
      "Layered throttling: account-level, stage-level, route/method-level, and usage-plan limits producing 429s with Retry-After semantics.",
      "Gateway responses 502/504 for integration errors and timeouts; customizable error bodies via Gateway Responses (REST).",
      "REST stage cache and canary deployments; CloudWatch metrics 4XXError, 5XXError, IntegrationLatency, Count and access logs for diagnosis.",
      "Multi-AZ managed service per Region; custom domains that can be replicated in another Region behind Route 53 failover."
    ],
    mitigations: [
      "Set route throttles deliberately and match Lambda reserved concurrency; monitor the 429 count and raise quotas ahead of campaigns.",
      "Make Lambda handlers idempotent and return well-formed proxy responses; move slow work to SQS/Step Functions and respond 202.",
      "Clients retry 429/502/503/504 with exponential backoff and jitter; put CloudFront caching in front of read-heavy GET routes.",
      "Alarm on 5XXError rate and IntegrationLatency p99; use canary stages so a bad deployment affects only a slice of traffic."
    ]
  },
  beginnerConnectionHint: "Browsers, apps, and partners talk to API Gateway over HTTPS; API Gateway checks their token, slows down anyone sending too much, and then wakes up a Lambda function (or reaches a private ALB through a VPC Link) to do the work, logging everything to CloudWatch."
},
{
  id: "cloudfront",
  name: "Amazon CloudFront",
  shortName: "CloudFront",
  fullName: "Amazon CloudFront",
  category: "networking",
  icon: "🌍",
  tagline: "Global CDN that caches and secures both the S3 frontend and the ALB/API at edge locations",
  whatIsIt: "Amazon CloudFront is AWS's content delivery network: a global network of edge locations that terminate TLS close to users, cache responses, and forward cache misses to origins such as S3 buckets, Application Load Balancers, API Gateway, or any HTTP server. A distribution defines origins, cache behaviors matched by path pattern, cache and origin request policies, TLS certificates, WAF protection, and access controls like signed URLs and Origin Access Control.",
  eli5: "Imagine your shop has one big warehouse far away, but you open little kiosks in every town. When someone in a town asks for a picture of a shoe, the kiosk hands over the copy it already has instead of sending them all the way to the warehouse. Only when the kiosk does not have something does it ask the warehouse. Everyone gets their stuff faster and the warehouse is less busy. CloudFront is the kiosks.",
  technical: "A CloudFront distribution is a global resource: viewers resolve its domain (or your alias via Route 53) to the nearest edge location, where TLS terminates using an ACM certificate that must be issued in us-east-1. Each request matches the most specific cache behavior by path pattern (e.g. /api/* before the default *), which selects an origin, viewer protocol policy, allowed methods, a cache policy (min/default/max TTL and cache key made of selected headers, cookies, and query strings), an origin request policy (what is forwarded to the origin), and a response headers policy. S3 origins are locked with Origin Access Control (SigV4-signed requests authorized by the bucket policy); custom origins like an ALB are reached over HTTPS, optionally with a secret custom header. Origin groups provide failover on connection errors or configured status codes, Origin Shield adds a regional caching layer, and AWS WAF (CLOUDFRONT scope), Shield Standard, signed URLs/cookies via key groups, geo restriction, CloudFront Functions, and Lambda@Edge run at the edge.",
  whyUse: [
    "Lower latency worldwide: TLS handshakes and cached responses are served from an edge near the user instead of one Region.",
    "Offloads the origin: static assets (HTML, JS, images) are served from cache, so S3 and the ALB see only cache misses and dynamic /api/* calls.",
    "One domain for everything: /static/* → S3, /api/* → ALB, /ws or /hooks → API Gateway, avoiding CORS and multiple certificates.",
    "Security at the edge: WAF web ACL, Shield Standard DDoS protection, TLS 1.2+/HTTP/3, signed URLs/cookies for private downloads, and Origin Access Control so the S3 bucket is never public.",
    "Cheaper egress: data transfer from CloudFront to viewers is priced below ALB/EC2 egress, and CloudFront's fetches from AWS origins are free."
  ],
  whenToUse: [
    "Serving a single-page frontend from a private S3 bucket over HTTPS on a custom domain.",
    "Fronting the ALB-based API to terminate TLS at the edge, apply WAF rules, and cache cacheable GET responses such as product listings.",
    "Delivering product images, videos, and downloads globally, including private assets via signed URLs or cookies.",
    "Absorbing traffic spikes and DDoS attempts before they reach the ALB or API Gateway.",
    "Adding security headers, redirects, or A/B routing with CloudFront Functions without touching the application."
  ],
  whenNotToUse: [
    "Purely internal or single-Region traffic that never leaves the VPC: an internal ALB is the alternative — a CDN adds no value.",
    "Uncacheable, latency-critical writes where the extra edge hop is measurable and users are all in one Region close to the origin: connect straight to the ALB (though WAF and Shield are then lost).",
    "Non-HTTP protocols or TCP/UDP acceleration: use AWS Global Accelerator in front of an NLB as the alternative.",
    "Large uploads: CloudFront supports them but S3 Transfer Acceleration or pre-signed S3 URLs are usually a better fit.",
    "As a substitute for authentication: signed URLs protect files, but application APIs still need their own auth (Cognito/JWT at the ALB or API Gateway)."
  ],
  placement: {
    scope: "global",
    subnet: "n/a",
    internetAccessible: true,
    summary: "CloudFront is a global service running in AWS edge locations worldwide, entirely outside your VPC. In the reference architecture it is the public entry point: viewers hit www.shop.example at the edge, and CloudFront pulls from the private S3 bucket and the internet-facing ALB in the public subnets (and optionally API Gateway).",
    securityGroup: "Not applicable — CloudFront has no ENIs in your VPC. Instead, the ALB security group should allow 443 only from the AWS-managed prefix list com.amazonaws.global.cloudfront.origin-facing so nothing can bypass the CDN.",
    nacl: "Not applicable to CloudFront itself. The public subnet NACL must allow inbound 443 from the internet (CloudFront edge IPs) to the ALB and ephemeral outbound return traffic.",
    routeTable: "Not applicable to CloudFront. Its ALB origin must be reachable over the internet, so the ALB subnets need the 0.0.0.0/0 → IGW route; S3 origins are reached over AWS's network.",
    nat: "Not required. CloudFront does not sit in your subnets and makes no outbound calls through your NAT Gateway.",
    igw: "Indirectly required: CloudFront reaches an internet-facing ALB origin through the ALB's public IPs, which exist only because of the Internet Gateway.",
    vpcOptional: "Optional: CloudFront VPC origins let a distribution reach an ALB, NLB, or EC2 instance in private subnets over an AWS-managed private connection, so the ALB need not be internet-facing at all. Otherwise the origin stays public and you rely on the prefix list plus a secret origin header."
  },
  dataFlow: {
    in: [
      "HTTPS (and HTTP redirected to HTTPS) requests from browsers and apps at the nearest edge location.",
      "Origin responses from S3 (static files), the ALB (API responses), and API Gateway, with Cache-Control headers that drive TTLs.",
      "Configuration: cache/origin request/response headers policies, WAF web ACL decisions, ACM certificate from us-east-1, key groups for signed URLs.",
      "Invalidation requests from CI/CD after a frontend deploy."
    ],
    out: [
      "Cached or fetched responses to viewers, compressed (gzip/brotli) and with response-header-policy security headers added.",
      "Cache-miss requests to origins with the configured origin request policy (selected headers/cookies/query strings), a secret X-Origin-Verify header to the ALB, and SigV4-signed requests to S3 via OAC.",
      "Standard access logs to S3 or real-time logs to Kinesis Data Streams; metrics (Requests, BytesDownloaded, 4xx/5xxErrorRate, CacheHitRate, OriginLatency) to CloudWatch in us-east-1.",
      "WAF sampled requests and Shield event data."
    ]
  },
  networking: [
    "Alternate domain names (www.shop.example) require an ACM certificate in us-east-1 and a Route 53 alias record to the distribution domain (d111111abcdef8.cloudfront.net).",
    "S3 origin: use the bucket's regional domain name with Origin Access Control; keep Block Public Access on and let the bucket policy trust only this distribution's ARN.",
    "ALB origin: protocol policy HTTPS-only to the ALB DNS name (its ACM cert must cover that name or the forwarded Host), origin response timeout ≤ ALB idle timeout, secret custom header checked by WAF/ALB.",
    "Behaviors are evaluated by path pattern in order: /api/* → ALB with CachingDisabled + AllViewerExceptHostHeader; default * → S3 with CachingOptimized.",
    "Enable HTTP/2 and HTTP/3, TLS 1.2_2021 minimum, IPv6, and choose a price class matching where your customers are."
  ],
  security: {
    iam: "cloudfront:* actions for operators/CI (CreateDistribution, UpdateDistribution, CreateInvalidation). The S3 bucket policy grants s3:GetObject to principal cloudfront.amazonaws.com with condition AWS:SourceArn = the distribution ARN (OAC). Lambda@Edge roles must trust both lambda.amazonaws.com and edgelambda.amazonaws.com.",
    securityGroups: "Not applicable to CloudFront; lock the ALB security group to the CloudFront origin-facing managed prefix list so only edge locations can reach the ALB.",
    nacl: "Not applicable to CloudFront; the ALB's public subnet NACL must permit 443 inbound from the internet.",
    encryption: "TLS from viewers to the edge (ACM certificate in us-east-1, SNI, TLSv1.2_2021 policy) and TLS from the edge to origins (HTTPS-only origin protocol policy). Field-level encryption can protect specific POST fields to the origin. S3 objects stay encrypted at rest (SSE-S3/SSE-KMS; OAC supports SSE-KMS with a key policy grant).",
    authentication: "Signed URLs/cookies (key groups with your public key; private key in Secrets Manager) authenticate access to private objects. API authentication still happens at the ALB/application or API Gateway — CloudFront forwards the Authorization header when the origin request policy includes it.",
    authorization: "WAF web ACL (managed rule groups, rate-based rules, geo match, custom header rule), geo restriction, and behavior-level allowed methods (GET/HEAD only for S3) decide what reaches an origin. Origin Access Control ensures S3 is reachable only through the distribution.",
    secrets: "The origin secret header value (X-Origin-Verify) and signed-URL private keys belong in Secrets Manager; rotate the header value by adding the new value to WAF before switching CloudFront.",
    leastPrivilege: "Bucket policy allows only this distribution; CI gets cloudfront:CreateInvalidation on one distribution ARN; viewers get GET/HEAD to S3 behaviors; ALB accepts only prefix-list + header-verified traffic."
  },
  iam: [
    "Operators/CI: cloudfront:CreateDistribution/UpdateDistribution/GetDistribution and cloudfront:CreateInvalidation scoped to the distribution ARN; acm:RequestCertificate in us-east-1.",
    "S3 origin (OAC): bucket policy statement allowing s3:GetObject to Service principal cloudfront.amazonaws.com with Condition StringEquals AWS:SourceArn = arn:aws:cloudfront::ACCOUNT:distribution/ID; SSE-KMS buckets also need a KMS key policy grant for the same principal/condition.",
    "WAF: wafv2:AssociateWebACL and the web ACL created with scope CLOUDFRONT in us-east-1.",
    "Signed URLs: cloudfront:CreatePublicKey/CreateKeyGroup for the public key; the application role reads the private key from Secrets Manager.",
    "Lambda@Edge / CloudFront Functions: lambda:EnableReplication and an execution role trusting lambda.amazonaws.com and edgelambda.amazonaws.com; access logs need an S3 bucket with ACLs enabled or a real-time log Kinesis stream role."
  ],
  scaling: [
    "Fully managed and globally distributed — no capacity to provision; edges absorb spikes and DDoS floods before they reach the Region.",
    "Cache hit ratio is the lever: correct Cache-Control headers, minimal cache keys (only the headers/cookies/query strings that change the response), and versioned asset filenames.",
    "Origin Shield adds a regional mid-tier cache that collapses requests from many edges into one origin fetch, protecting the ALB and S3 during traffic surges.",
    "Uncached /api/* traffic still passes through CloudFront, so the ALB and ECS must scale for dynamic requests; CloudFront only shields them from static load and TLS handshakes.",
    "Invalidations are asynchronous and per path; prefer immutable, hashed filenames over frequent invalidations."
  ],
  availability: [
    "Hundreds of edge locations and regional edge caches; DNS steers viewers away from impaired edges automatically with no configuration.",
    "Origin groups: define a primary and secondary origin (e.g. S3 bucket in two Regions, or two ALBs) and fail over on connection failure or on 500/502/503/504 (and optionally 403/404) for GET/HEAD/OPTIONS.",
    "If an origin returns 5xx while CloudFront revalidates an expired object, CloudFront serves the stale cached object; stale-while-revalidate and stale-if-error Cache-Control directives are honored.",
    "Custom error responses can serve a friendly maintenance page from S3 when the ALB is down, with a short error-caching TTL.",
    "Multi-Region active/passive: CloudFront origin group over two Regional stacks gives failover without DNS TTL delays for viewers."
  ],
  cost: [
    "Data transfer out to viewers per GB, tiered by geographic price class and volume (an always-free tier covers the first 1 TB and 10 million requests per month).",
    "HTTP/HTTPS requests billed per 10,000; HTTPS requests cost slightly more than HTTP.",
    "Data transfer from AWS origins (S3, ALB, API Gateway) to CloudFront is free, so caching lowers total egress cost versus serving directly from the ALB.",
    "Extras: invalidation paths beyond 1,000 per month, Origin Shield requests, CloudFront Functions and Lambda@Edge invocations, real-time logs, and dedicated-IP custom SSL (avoid — use SNI).",
    "WAF is billed separately per web ACL, per rule, and per million requests evaluated."
  ],
  commonMistakes: [
    "Leaving the S3 bucket public or using the S3 website endpoint instead of Origin Access Control with a private bucket.",
    "Requesting the ACM certificate in the application Region instead of us-east-1 and then failing to attach it to the distribution.",
    "Forwarding all headers/cookies/query strings in the cache key (or using the legacy 'forward all' settings), driving the cache hit ratio to zero.",
    "Forwarding the viewer Host header to the ALB whose certificate does not cover it, causing 502s; use AllViewerExceptHostHeader.",
    "Not restricting the ALB to the CloudFront prefix list and a secret header, so attackers bypass WAF by hitting the ALB DNS name.",
    "Deploying a new frontend build with the same filenames and no invalidation, so users get stale JS/CSS for hours.",
    "Using CloudFront's default cache TTL for API responses that must be fresh, or caching responses that include the Authorization header without varying the key."
  ],
  bestPractices: [
    "Private S3 bucket + Origin Access Control; HTTPS-only origin policy to the ALB with a secret X-Origin-Verify header enforced by WAF.",
    "Explicit behaviors: default * → S3 with CachingOptimized; /api/* → ALB with CachingDisabled and AllViewerExceptHostHeader; GET/HEAD only on S3 behaviors.",
    "ACM certificate in us-east-1, TLSv1.2_2021 minimum, HTTP/2 + HTTP/3, redirect-to-https viewer policy, response headers policy with HSTS and security headers.",
    "Hashed/immutable asset filenames with long max-age; short TTL (or no-cache) for index.html; invalidate /index.html on deploy.",
    "Attach a WAF web ACL with AWS managed rule groups and a rate-based rule; keep Shield Standard (free) and consider Origin Shield for high-traffic origins.",
    "Enable standard or real-time logs and alarm on 5xxErrorRate, OriginLatency, and CacheHitRate in CloudWatch (us-east-1).",
    "Use origin groups for the S3 frontend (bucket replicated to a second Region) so a static maintenance page is always available."
  ],
  creationSteps: [
    "Open the AWS Console in us-east-1 and go to Certificate Manager → Request a public certificate for www.shop.example; validate via DNS.",
    "Go to CloudFront → Distributions → Create distribution and set Origin domain to the S3 bucket (shop-frontend.s3.eu-west-1.amazonaws.com), origin access = Origin access control settings → Create new OAC.",
    "After creation, copy the generated bucket policy from the banner and apply it to the S3 bucket (Block Public Access stays on).",
    "Set the default behavior: viewer protocol policy Redirect HTTP to HTTPS, allowed methods GET/HEAD, cache policy CachingOptimized, compression on.",
    "Under Settings add alternate domain name www.shop.example, select the us-east-1 ACM certificate, security policy TLSv1.2_2021, enable HTTP/2 and HTTP/3, set default root object index.html.",
    "Under Web Application Firewall enable security protections (creates a WAF web ACL with managed rules) and click Create distribution.",
    "Open the distribution → Origins → Create origin: origin domain = the ALB DNS name, protocol HTTPS only, add custom header X-Origin-Verify with a long random value.",
    "Behaviors → Create behavior: path pattern /api/*, origin = the ALB, viewer protocol HTTPS only, allowed methods all (GET…DELETE), cache policy CachingDisabled, origin request policy AllViewerExceptHostHeader.",
    "In WAF (us-east-1, CloudFront scope) or on the ALB, add a rule that blocks requests to /api/* lacking the X-Origin-Verify header value; update the ALB security group to allow 443 only from the com.amazonaws.global.cloudfront.origin-facing prefix list.",
    "Under Error pages add a custom response for 503 → /maintenance.html with a 10-second TTL.",
    "In Route 53 create an alias A/AAAA record www.shop.example → the distribution, wait for status Deployed, then test https://www.shop.example/ and https://www.shop.example/api/health.",
    "Add a CI step that runs cloudfront create-invalidation for /index.html after each frontend deploy."
  ],
  productionRecommendations: [
    "S3 origin private via OAC; ALB origin HTTPS-only with secret header + prefix-list-restricted security group.",
    "Two behaviors minimum (static vs /api/*) with managed cache and origin request policies chosen deliberately.",
    "us-east-1 ACM certificate, TLSv1.2_2021, HTTP/2/3, HSTS via response headers policy.",
    "WAF web ACL with managed rules and rate limiting; Shield Standard on by default; Origin Shield for busy origins.",
    "Origin group for the S3 frontend across two Regions plus custom error pages.",
    "Logs enabled and CloudWatch alarms on 5xxErrorRate, OriginLatency, and CacheHitRate."
  ],
  configExample: {
    title: "Terraform — distribution with S3 (OAC) + ALB origins and two behaviors",
    lang: "hcl",
    code: `# aws_cloudfront_origin_access_control.site: origin type "s3", signing sigv4/always; bucket policy trusts this distribution ARN
resource "aws_cloudfront_distribution" "shop" {
  enabled    = true
  aliases    = ["www.shop.example"]
  web_acl_id = aws_wafv2_web_acl.edge.arn          # scope CLOUDFRONT (created in us-east-1)
  origin {                                         # 1) static frontend, private bucket
    origin_id                = "s3-site"
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }
  origin {                                         # 2) API behind the ALB
    origin_id   = "alb-api"
    domain_name = aws_lb.app.dns_name
    custom_origin_config {
      origin_protocol_policy = "https-only"
      http_port              = 80
      https_port             = 443
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    custom_header {
      name  = "X-Origin-Verify"                    # WAF/ALB rule blocks requests without it
      value = var.origin_secret
    }
  }
  default_cache_behavior {                         # /* -> S3
    target_origin_id       = "s3-site"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"   # Managed-CachingOptimized
  }
  ordered_cache_behavior {                         # /api/* -> ALB, never cached
    path_pattern             = "/api/*"
    target_origin_id         = "alb-api"
    viewer_protocol_policy   = "https-only"
    allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"   # Managed-CachingDisabled
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"   # Managed-AllViewerExceptHostHeader
  }
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.edge.arn           # MUST be in us-east-1
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
}`
  },
  productionChecklist: [
    "S3 bucket private (Block Public Access on) with Origin Access Control and a bucket policy scoped to this distribution ARN.",
    "ALB origin uses HTTPS-only, a secret custom header verified by WAF/ALB, and the ALB security group allows 443 only from the CloudFront prefix list.",
    "Behaviors: default → S3 (CachingOptimized, GET/HEAD), /api/* → ALB (CachingDisabled, AllViewerExceptHostHeader, all methods).",
    "ACM certificate issued in us-east-1; alternate domain names set; TLSv1.2_2021 minimum; redirect-to-https.",
    "WAF web ACL (CLOUDFRONT scope) attached with managed rules and a rate-based rule.",
    "Response headers policy adds HSTS, X-Content-Type-Options, and other security headers.",
    "Frontend assets use hashed filenames; CI invalidates /index.html on deploy.",
    "Origin group / custom error pages provide a maintenance page if the ALB is down.",
    "Standard or real-time logging enabled; alarms on 5xxErrorRate, OriginLatency, CacheHitRate.",
    "Route 53 alias A and AAAA records point to the distribution; HTTP/2 and HTTP/3 enabled."
  ],
  dependencies: [
    { id: "s3", kind: "required", why: "Origin for the static frontend and product images, locked with Origin Access Control." },
    { id: "alb", kind: "recommended", why: "Origin for /api/*; CloudFront terminates TLS at the edge and forwards misses to the ALB." },
    { id: "iam", kind: "required", why: "Bucket policy trusting the distribution, OAC, invalidation permissions, Lambda@Edge roles." },
    { id: "security-groups", kind: "recommended", why: "The ALB security group must admit only the CloudFront origin-facing prefix list." },
    { id: "cloudwatch", kind: "recommended", why: "Distribution metrics (in us-east-1) and alarms on error rates and origin latency." },
    { id: "api-gateway", kind: "optional", why: "Additional origin for serverless routes or WebSocket APIs under the same domain." },
    { id: "igw", kind: "optional", why: "An internet-facing ALB origin is reachable only via the IGW (not needed with VPC origins or S3-only)." },
    { id: "lambda", kind: "optional", why: "Lambda@Edge for request/response manipulation at the edge." },
    { id: "nlb", kind: "optional", why: "Possible origin (public or via VPC origins) for TCP-fronted HTTP services; not used by default." }
  ],
  related: ["s3", "alb", "api-gateway", "security-groups", "igw", "lambda"],
  ecommerceRole: "The public front door of the shop: www.shop.example resolves to CloudFront, which serves the React frontend and product images from the private S3 bucket and forwards /api/* to the ALB (and optionally webhook/WebSocket routes to API Gateway), adding TLS at the edge, WAF, DDoS protection, caching, and cheaper egress for both static and dynamic traffic.",
  failure: {
    title: "CloudFront edge or origin fails",
    whatHappens: "If an edge location is impaired, CloudFront's DNS stops directing viewers to it and they are served from another nearby edge — no action on your side. If the S3 origin fails, cached objects keep being served until they expire; with an origin group the request fails over to the secondary bucket, otherwise expired misses return 5xx and CloudFront serves stale copies when the origin answers 5xx during revalidation. If the ALB origin fails or times out, /api/* requests (uncached) return 502/504 to viewers immediately; a custom error response can show a maintenance page, but dynamic functionality is down until the ALB/ECS recovers or an origin group fails over to a second Region.",
    awsMechanisms: [
      "Global anycast/DNS routing across hundreds of edge locations and regional edge caches with automatic edge failover.",
      "Origin groups with primary/secondary origins and failover on connection errors or configured 5xx/4xx codes for GET/HEAD/OPTIONS.",
      "Stale content served when the origin returns 5xx during revalidation; stale-while-revalidate / stale-if-error directives; custom error responses with error caching TTL.",
      "CloudWatch metrics 5xxErrorRate, OriginLatency, CacheHitRate; Origin Shield to reduce origin load during recovery; Shield Standard against DDoS."
    ],
    mitigations: [
      "Configure an origin group for the S3 frontend (replicated bucket) and a custom 503/502 error page hosted in S3.",
      "Send Cache-Control with stale-if-error on cacheable API responses and static assets so the edge can keep serving during origin blips.",
      "Keep the ALB itself resilient (2 AZs, healthy targets) and set the CloudFront origin response timeout consistent with the ALB idle timeout.",
      "Alarm on 5xxErrorRate and OriginLatency; for Regional DR, add a second Regional ALB as the secondary origin in an origin group."
    ]
  },
  beginnerConnectionHint: "Your users' browsers talk to CloudFront first; CloudFront hands back files it already has and otherwise asks S3 (for the website files) or the ALB (for the API) and remembers the answer for next time."
});
