/* Networking — VPC foundations: VPC, CIDR, Subnets, Route Tables, Internet Gateway, NAT Gateway (schema: _schema.md) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "vpc",
  name: "Amazon VPC",
  shortName: "VPC",
  fullName: "Amazon Virtual Private Cloud",
  category: "networking",
  icon: "🏠",
  tagline: "Your private, isolated network inside an AWS Region — everything else plugs into it",
  whatIsIt: "Amazon VPC is a logically isolated virtual network that you define inside one AWS Region. You choose its IPv4 address range (CIDR), carve it into subnets across Availability Zones, and control how traffic enters and leaves with route tables, gateways, security groups, and network ACLs. Compute and databases such as EC2, ECS tasks, and RDS are launched into it.",
  eli5: "A VPC is like your own fenced garden inside a giant park. You decide how big the garden is, where the paths go, and which gates open to the outside street. Your toys (servers and databases) live inside the fence, and only the gates you build let anyone in or out.",
  technical: "A VPC is a Region-scoped, software-defined Layer 3 network with a primary IPv4 CIDR between /16 and /28 (secondary IPv4 CIDRs and an optional /56 IPv6 block can be associated later). It spans every Availability Zone in the Region; subnets are AZ-scoped slices of the CIDR. Traffic policy is expressed with route tables (per subnet), an Internet Gateway or NAT Gateway for egress, stateful security groups on ENIs, stateless NACLs on subnets, and VPC endpoints (gateway endpoints for S3/DynamoDB, interface endpoints via PrivateLink for other services). Amazon-provided DNS listens at the VPC base address +2 (10.0.0.2 for 10.0.0.0/16).",
  whyUse: [
    "Isolation: your servers and databases get private IP space that nobody else on AWS can address unless you explicitly connect it.",
    "Segmentation: public, application, and database tiers can be separated into subnets with different routes and firewall rules.",
    "Control over ingress and egress: only the gateways and routes you create allow traffic in or out.",
    "Foundation for everything: EC2, ECS, RDS, ALB, NAT, and Lambda-in-VPC all require subnets to launch into.",
    "Private access to AWS services: VPC endpoints keep S3, DynamoDB, ECR, and SQS traffic on the AWS network instead of the public internet."
  ],
  whenToUse: [
    "Any workload that runs EC2 instances, ECS tasks, or RDS databases — they must be launched into VPC subnets.",
    "A multi-tier application where the database must never be reachable from the internet.",
    "Connecting to on-premises networks with Site-to-Site VPN or Direct Connect, or to other VPCs with peering or Transit Gateway.",
    "Compliance requirements that demand network-level isolation, flow logging, and private connectivity to AWS services."
  ],
  whenNotToUse: [
    "A purely serverless stack (API Gateway → Lambda → DynamoDB/S3) has no VPC requirement; attaching Lambda to a VPC only adds ENI setup and NAT cost unless it must reach RDS or other private resources.",
    "Using the default VPC for production: its subnets are all public with auto-assigned public IPs; create a custom VPC instead.",
    "One giant flat VPC with a single subnet for everything: use tiered subnets across two AZs so the database and app tiers can have different routes.",
    "A separate VPC per microservice 'for isolation' without a connectivity plan: many VPCs means peering/Transit Gateway complexity; prefer one VPC per environment with security groups for service isolation."
  ],
  placement: {
    scope: "vpc-edge",
    subnet: "n/a",
    internetAccessible: false,
    summary: "The VPC is the container itself: it lives in one Region and spans all of that Region's AZs. Nothing inside it is reachable from the internet until you attach an Internet Gateway, add a route to it, and give a resource a public IP.",
    securityGroup: "Security groups are a VPC-scoped resource: each SG belongs to exactly one VPC and is attached to ENIs of resources inside it (ECS tasks, EC2, RDS, ALB). The VPC comes with a default SG that allows all traffic between its members; create dedicated SGs per tier instead.",
    nacl: "Every VPC has a default NACL that allows all inbound and outbound traffic; every subnet uses it until you create custom NACLs. NACLs are stateless and evaluated per subnet.",
    routeTable: "The VPC has a main route table containing only the local route (10.0.0.0/16 → local). Subnets not explicitly associated with a custom table use the main one — keep the main table private (no 0.0.0.0/0 route).",
    nat: "Optional. A NAT Gateway is only needed when private subnets must initiate outbound connections to the internet (package updates, third-party APIs).",
    igw: "Optional overall, but required for any public subnet. Exactly one IGW can be attached to a VPC; without it nothing in the VPC can reach or be reached from the internet directly.",
    vpcOptional: "Regional services such as S3, DynamoDB, SQS, SNS, CloudWatch, and ECR live outside your VPC. Reach them via their public endpoint (through NAT/IGW) or privately via VPC endpoints: gateway endpoints for S3 and DynamoDB (free, route-table based) and interface endpoints (PrivateLink ENIs in your subnets, hourly + per-GB) for the rest."
  },
  dataFlow: {
    in: [
      "Inbound internet traffic through the Internet Gateway to public-IP resources such as the ALB (typically from CloudFront).",
      "Traffic from peered VPCs, Transit Gateway attachments, or VPN/Direct Connect from on-premises.",
      "Responses from AWS services (S3, DynamoDB, ECR) arriving via VPC endpoints or through the NAT Gateway."
    ],
    out: [
      "Responses to internet clients via the IGW (1:1 NAT from private to public IP).",
      "Outbound-initiated connections from private subnets via the NAT Gateway to the internet.",
      "Private traffic to AWS services via gateway/interface endpoints.",
      "VPC Flow Logs (accepted/rejected connection records) to CloudWatch Logs or S3."
    ]
  },
  networking: [
    "Choose a CIDR between /16 and /28 that does not overlap with any network you may peer with or connect via VPN; /16 (65,536 addresses) is the common production choice.",
    "Enable both DNS resolution and DNS hostnames; interface endpoints with private DNS and many service hostnames rely on them.",
    "Create subnets in at least two AZs per tier; the VPC spans all AZs but a subnet is fixed to one.",
    "Add gateway endpoints for S3 and DynamoDB to every private route table so that traffic never traverses the NAT Gateway.",
    "Turn on VPC Flow Logs for troubleshooting rejected connections and for security auditing."
  ],
  security: {
    iam: "IAM controls who can create, modify, and delete the VPC and its components (ec2:CreateVpc, ec2:ModifyVpcAttribute, ec2:CreateVpcEndpoint, ec2:DeleteVpc). Application code needs no VPC permissions at runtime.",
    securityGroups: "SGs are the primary, stateful, per-resource firewall inside the VPC. Reference other SGs (alb-sg → ecs-sg → rds-sg) rather than CIDRs so rules follow the resources.",
    nacl: "NACLs add a stateless subnet-level layer; most teams keep the default allow-all NACL and tighten only the database subnets, remembering to allow ephemeral ports (1024–65535) for return traffic.",
    encryption: "On supported Nitro instance types AWS automatically encrypts traffic between instances in the same or peered VPCs, but do not rely on that alone: terminate TLS at the ALB and use TLS to RDS. Flow Logs delivered to S3 can be encrypted with KMS.",
    authentication: "The VPC does not authenticate anything; it decides reachability. Authentication happens at the application (Cognito/JWT), at IAM for AWS APIs, and at the database.",
    authorization: "Network authorization is layered: route tables (can the packet get there), NACLs (subnet allow/deny), security groups (per-ENI allow), and VPC endpoint policies (which S3 buckets or DynamoDB tables may be reached through the endpoint).",
    secrets: "No secrets live in the VPC configuration. Keep VPC/subnet IDs in Terraform state or SSM Parameter Store, and application secrets in Secrets Manager.",
    leastPrivilege: "Restrict ec2:* networking actions to a platform/infra role and the CI pipeline; use SCPs or IAM conditions to forbid creating IGWs or 0.0.0.0/0 routes in sensitive VPCs. Attach endpoint policies to gateway endpoints so only your buckets are reachable."
  },
  iam: [
    "Infra/CI role: ec2:CreateVpc, ec2:ModifyVpcAttribute (DNS settings), ec2:CreateSubnet, ec2:CreateRouteTable, ec2:CreateInternetGateway, ec2:CreateNatGateway, ec2:CreateVpcEndpoint, ec2:CreateTags.",
    "Read-only/operators: ec2:Describe* to inspect VPCs, subnets, routes, and endpoints.",
    "VPC Flow Logs delivered to CloudWatch Logs need an IAM role trusted by vpc-flow-logs.amazonaws.com with logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents.",
    "Optional: gateway endpoint policies (resource policies on the endpoint) restrict which S3 buckets/DynamoDB tables can be reached through the endpoint.",
    "Application task roles need no VPC permissions — except Lambda attached to a VPC, whose execution role needs ec2:CreateNetworkInterface, ec2:DescribeNetworkInterfaces, ec2:DeleteNetworkInterface (AWSLambdaVPCAccessExecutionRole)."
  ],
  scaling: [
    "Address space: the primary CIDR cannot be changed, but you can associate secondary IPv4 CIDR blocks (and an IPv6 block) to grow the VPC later.",
    "The VPC data plane is AWS-managed and has no throughput ceiling of its own; limits come from instance/ENI bandwidth, NAT Gateway capacity, and ALB scaling.",
    "Default service quotas (e.g. 5 VPCs per Region, 200 subnets per VPC, 50 routes per route table) are adjustable via Service Quotas.",
    "Multi-VPC growth: connect environments with VPC peering (non-transitive) or Transit Gateway (hub-and-spoke) rather than making one VPC do everything."
  ],
  availability: [
    "A VPC is a regional construct that spans all AZs; its control and data planes are AWS-managed with no single point of failure you operate.",
    "Availability is really about subnets: place each tier in at least two AZs so an AZ failure takes out only part of the capacity.",
    "Gateway components differ: the IGW is redundant across the Region; a NAT Gateway is AZ-resident, so deploy one per AZ.",
    "Disaster recovery to another Region means creating a second VPC there (same Terraform module) with a non-overlapping CIDR so the two can be peered."
  ],
  cost: [
    "The VPC, subnets, route tables, IGW, security groups, and NACLs are free.",
    "NAT Gateway: hourly per gateway plus per-GB data processed — usually the biggest VPC networking bill.",
    "Interface VPC endpoints: hourly per endpoint per AZ plus per-GB; gateway endpoints for S3/DynamoDB are free.",
    "Data transfer: cross-AZ traffic is charged per GB in each direction; internet egress via IGW is charged per GB; public IPv4 addresses are billed hourly.",
    "VPC Flow Logs incur CloudWatch Logs or S3 ingestion/storage charges."
  ],
  commonMistakes: [
    "Using the default VPC (all subnets public) for production workloads.",
    "Choosing a CIDR that overlaps with the office network or another VPC, making VPN/peering impossible later.",
    "Leaving DNS hostnames disabled, then wondering why interface endpoints' private DNS or instance hostnames do not resolve.",
    "Adding a 0.0.0.0/0 → igw route to the main route table so every new subnet is accidentally public.",
    "Paying NAT data-processing charges on S3 and ECR traffic when a free S3 gateway endpoint or ECR interface endpoints would keep it private.",
    "Building only one AZ 'for now' and discovering that the DB subnet group and the ALB both need two.",
    "Never enabling Flow Logs, so rejected connections are debugged by guesswork."
  ],
  bestPractices: [
    "One custom VPC per environment (prod, staging) with a /16 from a documented IP allocation plan.",
    "Three tiers × two AZs: public (ALB, NAT), private-app (ECS/EC2), private-db (RDS), each with its own route table.",
    "Enable DNS support and DNS hostnames; use private DNS on interface endpoints.",
    "Gateway endpoints for S3 and DynamoDB in every private route table; interface endpoints for ECR, CloudWatch Logs, Secrets Manager when NAT cost or compliance requires.",
    "Keep the main route table free of internet routes; explicitly associate every subnet.",
    "Enable VPC Flow Logs (REJECT or ALL) to CloudWatch Logs or S3 with a retention policy.",
    "Define the whole network in Terraform/CloudFormation so staging and prod are identical and reviewable."
  ],
  creationSteps: [
    "Open the AWS Console and go to VPC → Your VPCs → Create VPC.",
    "Choose 'VPC only' to build each piece yourself (or 'VPC and more' for the wizard that also creates subnets, route tables, IGW, and NAT).",
    "Enter a name tag such as shop-prod-vpc and the IPv4 CIDR 10.0.0.0/16; leave IPv6 off unless you need it.",
    "Keep Tenancy = Default (Dedicated tenancy costs significantly more).",
    "Click Create VPC, then select it and choose Actions → Edit VPC settings; tick 'Enable DNS resolution' and 'Enable DNS hostnames'.",
    "Create six subnets (Subnets → Create subnet): two public, two private-app, two private-db across two AZs using the CIDR plan.",
    "Create an Internet Gateway (Internet gateways → Create) and attach it to the VPC (Actions → Attach to VPC).",
    "Create a NAT Gateway in each public subnet, each with a new Elastic IP.",
    "Create route tables: public (0.0.0.0/0 → igw), private-app per AZ (0.0.0.0/0 → the NAT of that AZ), db (local only); associate the subnets.",
    "Go to Endpoints → Create endpoint → com.amazonaws.<region>.s3 (Gateway) and select the private route tables; repeat for DynamoDB.",
    "Enable Flow Logs on the VPC (Flow logs tab → Create flow log) to a CloudWatch Logs group.",
    "Verify: a resource in a public subnet with a public IP reaches the internet; one in a private subnet reaches it only via NAT; the DB subnets have no internet route."
  ],
  productionRecommendations: [
    "Custom VPC per environment, never the default VPC.",
    "DNS resolution and DNS hostnames enabled.",
    "Two AZs minimum for every tier; NAT Gateway per AZ.",
    "Gateway endpoints for S3 and DynamoDB; interface endpoints where NAT spend or compliance justifies them.",
    "Flow Logs enabled with retention; alarms on rejected-traffic spikes.",
    "Everything as code with a non-overlapping CIDR reserved in a central IP plan."
  ],
  configExample: {
    title: "Terraform — VPC with DNS enabled, S3 gateway endpoint, Flow Logs",
    lang: "hcl",
    code: `resource "aws_vpc" "shop" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true   # Amazon DNS resolver at 10.0.0.2
  enable_dns_hostnames = true   # needed for endpoint private DNS
  instance_tenancy     = "default"

  tags = { Name = "shop-prod-vpc", Environment = "prod" }
}

# Free gateway endpoint: S3 traffic from private subnets bypasses NAT
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.shop.id
  service_name      = "com.amazonaws.eu-west-1.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private["a"].id, aws_route_table.private["b"].id]
}

resource "aws_flow_log" "vpc" {
  vpc_id               = aws_vpc.shop.id
  traffic_type         = "REJECT"
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow.arn
  iam_role_arn         = aws_iam_role.flow_logs.arn
}`
  },
  productionChecklist: [
    "Custom VPC with a documented, non-overlapping /16 CIDR.",
    "DNS resolution and DNS hostnames enabled.",
    "Six subnets: public, private-app, private-db in two AZs.",
    "Main route table has no internet route; every subnet explicitly associated.",
    "IGW attached; NAT Gateway in each AZ's public subnet.",
    "Gateway endpoints for S3 and DynamoDB attached to private route tables.",
    "Default security group unused; dedicated SGs per tier.",
    "VPC Flow Logs enabled with a retention period.",
    "Network defined in Terraform/CloudFormation and peer-reviewed."
  ],
  dependencies: [
    { id: "cidr", kind: "required", why: "You must choose the VPC's IPv4 address range before anything else." },
    { id: "subnets", kind: "required", why: "Resources launch into subnets, not directly into the VPC." },
    { id: "route-tables", kind: "required", why: "Every subnet uses a route table; the VPC ships with a main table." },
    { id: "security-groups", kind: "required", why: "Per-resource stateful firewall for everything launched in the VPC." },
    { id: "igw", kind: "recommended", why: "Required only if any subnet must be public (ALB, NAT Gateway)." },
    { id: "nat-gateway", kind: "recommended", why: "Lets private subnets initiate outbound internet connections." },
    { id: "nacl", kind: "optional", why: "Stateless subnet-level filtering; the default allow-all is acceptable for most tiers." },
    { id: "cloudwatch", kind: "recommended", why: "Destination for VPC Flow Logs and NAT/endpoint metrics." }
  ],
  related: ["cidr", "subnets", "route-tables", "igw", "nat-gateway", "security-groups", "nacl"],
  ecommerceRole: "The VPC 10.0.0.0/16 is the network that holds the whole shop: ALB and NAT Gateways in public subnets, ECS Fargate tasks in private-app subnets, RDS in private-db subnets. CloudFront, S3, DynamoDB, API Gateway, Lambda (unless attached), and CloudWatch live outside it and are reached via endpoints or the gateways.",
  failure: {
    title: "VPC misconfiguration (DNS, CIDR exhaustion)",
    whatHappens: "The VPC itself does not 'go down' — AWS runs its data plane redundantly across the Region — but misconfiguration produces outages that look like one. With DNS hostnames disabled, interface endpoints and service hostnames fail to resolve, so tasks cannot pull images or reach Secrets Manager. When a subnet exhausts its IP addresses, ECS cannot place new Fargate tasks (each takes an ENI/IP), Auto Scaling launches fail, and Lambda-in-VPC cannot create ENIs — the symptom is an insufficient-free-addresses error during a scale-out, typically during a sale. A wrong or overlapping CIDR blocks peering/VPN and cannot be fixed without rebuilding the VPC.",
    awsMechanisms: [
      "Secondary CIDR blocks can be associated to a VPC to add address space without recreating it.",
      "Amazon-provided DNS (Route 53 Resolver at VPC +2) and endpoint private DNS once the DNS attributes are enabled.",
      "Subnet AvailableIpAddressCount (console/DescribeSubnets) and ECS service events expose exhaustion; Flow Logs show rejected traffic.",
      "AWS Config rules and VPC IP Address Manager (IPAM) detect overlaps and track utilisation."
    ],
    mitigations: [
      "Plan /24 (251 usable) or larger subnets for tiers that scale (ECS tasks consume one IP each) and monitor free addresses.",
      "Enable DNS support and DNS hostnames at creation and codify them in Terraform so they are never toggled off.",
      "Reserve CIDRs in a central IP plan (or IPAM) so VPCs never overlap with each other or on-premises networks.",
      "Add a secondary CIDR and new subnets before exhaustion; alarm on ECS placement failures and Auto Scaling launch errors."
    ]
  },
  beginnerConnectionHint: "The VPC is the box everything else sits in: the Internet Gateway is its front door, subnets are its rooms, and route tables are the signposts inside; S3, DynamoDB, and CloudWatch live outside the box and are reached through endpoints or the gateways."
},
{
  id: "cidr",
  name: "CIDR Blocks",
  shortName: "CIDR",
  fullName: "Classless Inter-Domain Routing address blocks",
  category: "networking",
  icon: "🔢",
  tagline: "IP address ranges written as 10.0.0.0/16 — how you size a VPC and its subnets",
  whatIsIt: "CIDR (Classless Inter-Domain Routing) notation describes a contiguous range of IP addresses as a base address plus a prefix length, e.g. 10.0.0.0/16. The prefix length is how many leading bits are fixed; the remaining bits are the addresses inside the block. In AWS you assign a CIDR to the VPC and then carve non-overlapping smaller CIDRs out of it for each subnet.",
  eli5: "Imagine a street with numbered houses. A CIDR block is like saying 'all the houses from 100 to 355 belong to our family'. A small number after the slash means a huge stretch of street; a big number means just a few houses. You give your whole neighbourhood one big range and then hand each smaller group of houses its own piece, making sure no two groups claim the same house.",
  technical: "A /N prefix leaves 32−N host bits, giving 2^(32−N) addresses: /16 = 65,536, /24 = 256, /28 = 16. AWS VPC and subnet CIDRs must be between /16 and /28 and should come from the RFC 1918 private ranges 10.0.0.0/8, 172.16.0.0/12, or 192.168.0.0/16. In every subnet AWS reserves the first four addresses (network, VPC router, Amazon DNS, future use) and the last (network broadcast), so a /24 yields 251 usable addresses and a /28 only 11. Route tables use longest-prefix match, so a /24 route wins over a /16 route for an address they both cover.",
  whyUse: [
    "Sizing: the prefix decides how many resources a VPC or subnet can hold; ECS tasks, ALB nodes, NAT Gateways, RDS instances, and interface endpoints each consume an IP.",
    "Segmentation: distinct subnet CIDRs let route tables and NACLs treat public, app, and database tiers differently.",
    "Connectivity: non-overlapping CIDRs are a hard prerequisite for VPC peering, Transit Gateway, and Site-to-Site VPN.",
    "Readable firewall rules: NACL entries and internet-facing security-group rules reference CIDRs, so a tidy plan makes rules understandable."
  ],
  whenToUse: [
    "Creating a VPC: pick the primary CIDR (10.0.0.0/16 in the reference architecture) from a company-wide allocation plan.",
    "Creating subnets: assign each of the six subnets a /24 from a distinct part of the VPC range (10.0.1.0/24, 10.0.11.0/24, 10.0.21.0/24 …) so tiers are recognisable at a glance.",
    "Writing routes: 0.0.0.0/0 means 'everything else'; a gateway endpoint uses an AWS-managed prefix list; on-premises routes use the corporate CIDR.",
    "Planning peering or VPN: check that both sides' CIDRs are disjoint before you build anything."
  ],
  whenNotToUse: [
    "Do not reuse the same CIDR (e.g. 10.0.0.0/16) in every VPC 'because it is the template'; those VPCs can never be peered. Allocate a unique range per VPC — AWS IPAM is the managed alternative to a spreadsheet.",
    "Do not use tiny subnets (/28, 11 usable) for tiers that scale such as ECS tasks or Lambda-in-VPC; use /24 or bigger — IP exhaustion blocks scaling.",
    "Do not use public or non-RFC 1918 ranges that collide with real internet addresses or partner networks; stick to 10.x, 172.16–31.x, or 192.168.x.",
    "Do not fill the entire /16 with subnets on day one; leave unallocated space for new tiers, more AZs, or a secondary CIDR later.",
    "Do not rely on CIDR-based security-group rules for app-to-app traffic when you can reference security groups instead; CIDR rules break when tasks move subnets."
  ],
  placement: {
    scope: "concept",
    subnet: "n/a",
    internetAccessible: false,
    summary: "CIDR is a numbering scheme, not a deployable resource. It appears wherever an address range is needed: the VPC definition, subnet definitions, route destinations, and NACL and security-group rules.",
    securityGroup: "Not applicable — CIDRs are what security-group rules use as sources/destinations (e.g. allow 443 from 0.0.0.0/0 on the ALB); a CIDR block itself has no security group.",
    nacl: "Not applicable — NACL rules are written in terms of CIDRs (allow 5432 from 10.0.11.0/24 and 10.0.12.0/24), but a CIDR is not something a NACL attaches to.",
    routeTable: "Not applicable as a resource — every route's destination is a CIDR (10.0.0.0/16 local, 0.0.0.0/0 igw/nat) or a prefix list, and the most specific prefix wins.",
    nat: "Not applicable — CIDR needs no NAT; it only defines which private ranges (the private-app subnets) a NAT Gateway will translate.",
    igw: "Not applicable — CIDR needs no gateway; a public subnet's CIDR gets internet access only through a route to an IGW."
  },
  dataFlow: {
    in: [
      "Design inputs: number of AZs, tiers, expected peak resource count per tier, and existing corporate/partner ranges to avoid.",
      "Address requests: every ENI (ECS task, EC2, RDS, ALB node, NAT Gateway, interface endpoint, Lambda-in-VPC) takes one IP from its subnet CIDR."
    ],
    out: [
      "VPC and subnet definitions in the console/Terraform.",
      "Route destinations, NACL entries, and CIDR-based security-group rules.",
      "Documentation for peering/VPN partners: 'our VPC is 10.0.0.0/16'."
    ]
  },
  networking: [
    "VPC CIDR must be /16 to /28; subnet CIDRs must lie inside the VPC CIDR and must not overlap each other.",
    "Five addresses per subnet are reserved by AWS (.0 network, .1 VPC router, .2 DNS resolver, .3 future use, last address broadcast) — plan with 251 usable per /24.",
    "Use RFC 1918 space: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (172.31.0.0/16 is what the default VPC uses).",
    "Secondary CIDR blocks may be added to a VPC later, but the primary CIDR cannot be changed or shrunk.",
    "0.0.0.0/0 is the default route; when two routes overlap, the longer prefix (more specific) is selected."
  ],
  security: {
    iam: "There is no IAM API for CIDR itself; the permissions are the VPC/subnet ones (ec2:CreateVpc, ec2:AssociateVpcCidrBlock, ec2:CreateSubnet). AWS IPAM adds ec2:*Ipam* permissions if you use it to allocate ranges.",
    securityGroups: "Prefer security-group references to CIDR rules for east-west traffic; use CIDR rules for internet ingress (0.0.0.0/0:443 on the ALB) and for on-premises ranges.",
    nacl: "NACL rules are entirely CIDR-based; a clean tier layout (10.0.1x for app, 10.0.2x for DB) lets you write two rules instead of many.",
    encryption: "Not applicable — CIDR is an addressing scheme; encryption is handled by TLS at the ALB/RDS and by KMS on storage.",
    authentication: "Not applicable — an IP address is not an identity; never treat 'came from 10.0.11.0/24' as authentication of a service.",
    authorization: "CIDR ranges are coarse network authorization inputs (routes, NACLs, SG CIDR rules). Application-level authorization must still be enforced in the API.",
    secrets: "Not applicable — CIDR plans are not secrets; publish them in an internal wiki or IPAM so no team picks an overlapping range.",
    leastPrivilege: "Grant each tier only the routes and rules its CIDR needs: the DB subnets have no default route, and the DB NACL/SG admits only the app subnet CIDRs or the app SG."
  },
  iam: [
    "Infra/CI role: ec2:CreateVpc, ec2:AssociateVpcCidrBlock, ec2:DisassociateVpcCidrBlock, ec2:CreateSubnet, ec2:ModifySubnetAttribute to define and extend ranges.",
    "Read-only: ec2:DescribeVpcs and ec2:DescribeSubnets to audit CIDR usage and AvailableIpAddressCount.",
    "If using AWS IPAM: ec2:CreateIpam, ec2:CreateIpamPool, ec2:AllocateIpamPoolCidr so VPCs are created from managed pools."
  ],
  scaling: [
    "A /16 VPC (65,536 addresses) comfortably holds dozens of /24 subnets; the reference design uses six and leaves the rest free.",
    "If a subnet fills up, create a larger new subnet (e.g. a /22 with 1,019 usable) in the same AZ and migrate the ECS service; subnets cannot be resized in place.",
    "If the VPC fills up, associate a secondary CIDR block (e.g. 10.1.0.0/16) and create subnets inside it.",
    "ECS Fargate awsvpc tasks, Lambda-in-VPC ENIs, and interface endpoints all consume IPs — count them when sizing the private-app subnets."
  ],
  availability: [
    "CIDR planning is what makes Multi-AZ possible: each tier needs one subnet CIDR per AZ (10.0.1.0/24 in AZ-a, 10.0.2.0/24 in AZ-b).",
    "Leave symmetric spare ranges for a third AZ (10.0.3.0/24, 10.0.13.0/24, 10.0.23.0/24) so adding it later follows the pattern.",
    "DR-Region VPCs need their own non-overlapping range (e.g. 10.10.0.0/16) so the two Regions can be peered for replication traffic."
  ],
  cost: [
    "CIDR blocks and private IPv4 addresses are free.",
    "Public IPv4 addresses (Elastic IPs and auto-assigned) are billed per hour, so keep public-IP usage to the ALB and NAT Gateways.",
    "AWS IPAM's advanced tier charges per managed IP address; the free tier covers basic allocation.",
    "A poor plan costs indirectly: rebuilding a VPC to fix an overlapping CIDR is a full migration."
  ],
  commonMistakes: [
    "Assuming a /24 has 256 usable hosts and being surprised at 251.",
    "Giving every environment the identical 10.0.0.0/16 so prod cannot peer with the shared-services VPC.",
    "Making public subnets huge and app subnets tiny, even though ECS tasks (not the ALB) are what scale out.",
    "Overlapping subnets by hand-typing ranges (10.0.1.0/24 and 10.0.0.0/23 collide) — the console rejects it, Terraform plans fail late.",
    "Picking 172.31.0.0/16 (the default VPC range) for a custom VPC and later being unable to peer with an account's default VPC.",
    "Using 0.0.0.0/0 as a security-group source for internal ports 'temporarily'.",
    "Forgetting that the VPC's primary CIDR is immutable, so the fix for a bad choice is a rebuild."
  ],
  bestPractices: [
    "Keep a central IP allocation plan (spreadsheet or AWS IPAM): one /16 per VPC, per environment, per Region, none overlapping.",
    "Encode the tier in the third octet: 10.0.1–9 public, 10.0.11–19 private-app, 10.0.21–29 private-db.",
    "Use /24 subnets as the default unit (251 usable); go bigger (/22) for tiers with hundreds of ECS tasks.",
    "Leave at least half of the VPC range unallocated for growth.",
    "Avoid 172.31.0.0/16 and common home ranges (192.168.0.0/24, 192.168.1.0/24) that collide with VPN clients.",
    "Derive subnets with Terraform's cidrsubnet() function so they are computed, not hand-typed.",
    "Alarm when a subnet's available IP count drops below a threshold (ECS placement failures are the symptom)."
  ],
  creationSteps: [
    "Before opening the console, write the plan: VPC 10.0.0.0/16; public 10.0.1.0/24 (AZ-a) and 10.0.2.0/24 (AZ-b); private-app 10.0.11.0/24 and 10.0.12.0/24; private-db 10.0.21.0/24 and 10.0.22.0/24.",
    "Check the plan against existing VPCs (VPC console → Your VPCs → IPv4 CIDR column) and the corporate network ranges to be sure nothing overlaps.",
    "Open VPC → Your VPCs → Create VPC and enter 10.0.0.0/16 as the IPv4 CIDR block (any value from /16 to /28 is accepted).",
    "Open Subnets → Create subnet, select the VPC, and add the first subnet: name shop-public-a, Availability Zone a, IPv4 subnet CIDR 10.0.1.0/24.",
    "Click 'Add new subnet' and repeat for the remaining five, changing the AZ and CIDR each time; the console rejects overlapping ranges immediately.",
    "After creation, open each subnet and confirm 'Available IPv4 addresses' shows 251 — the five reserved addresses are already subtracted.",
    "Record the six CIDRs; you will type them into NACL rules and (optionally) the DB security group later.",
    "If you ever need more space, select the VPC → Actions → Edit CIDRs → Add new IPv4 CIDR (e.g. 10.1.0.0/16) and create subnets inside it."
  ],
  productionRecommendations: [
    "One /16 per VPC from a central, non-overlapping plan.",
    "/24 subnets minimum; larger for tiers that autoscale.",
    "Tier-encoded third octet so routes, NACLs, and logs are readable.",
    "At least 50% of the VPC left unallocated for growth.",
    "Alarm on low available-IP counts in app subnets."
  ],
  configExample: {
    title: "Subnet plan — reference e-commerce VPC with usable host counts",
    lang: "text",
    code: `VPC  10.0.0.0/16   65,536 addresses  (AWS allows /16 .. /28)

Tier         AZ-a           AZ-b           Size  Usable  Holds
public       10.0.1.0/24    10.0.2.0/24    256   251     ALB nodes, NAT GW
private-app  10.0.11.0/24   10.0.12.0/24   256   251     ECS tasks, EC2
private-db   10.0.21.0/24   10.0.22.0/24   256   251     RDS primary/standby

Reserved per subnet (5): .0 network, .1 VPC router,
                         .2 Amazon DNS, .3 future use, .255 broadcast
Spare for growth: 10.0.3-9.x, 10.0.13-19.x, 10.0.23-29.x, 10.0.30-255.x

Prefix   Addresses  Usable
/16      65,536     65,531
/20       4,096      4,091
/22       1,024      1,019
/24         256        251
/28          16         11   (smallest AWS allows)

Rules: no two subnets may overlap; no two peered VPCs may overlap.
RFC 1918 private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16`
  },
  productionChecklist: [
    "VPC CIDR chosen from the central plan and documented.",
    "No overlap with other VPCs, on-premises networks, or VPN client ranges.",
    "Six /24 subnets follow the tier-encoded pattern across two AZs.",
    "Each subnet shows 251 available addresses at creation.",
    "Spare ranges reserved for a third AZ and new tiers.",
    "Subnets derived with cidrsubnet() in Terraform, not hand-typed.",
    "Alarm or dashboard for available IPs in private-app subnets."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "The VPC's primary CIDR is the range all subnets are carved from." },
    { id: "subnets", kind: "required", why: "Each subnet takes a non-overlapping slice of the VPC CIDR." },
    { id: "route-tables", kind: "recommended", why: "Route destinations are CIDRs; the plan decides which prefixes go where." },
    { id: "nacl", kind: "optional", why: "NACL rules are written against subnet CIDRs." },
    { id: "security-groups", kind: "optional", why: "Internet-facing SG rules use CIDRs; internal rules should reference SGs instead." }
  ],
  related: ["vpc", "subnets", "route-tables", "nacl", "security-groups"],
  ecommerceRole: "The shop's plan is VPC 10.0.0.0/16 split into public 10.0.1.0/24 & 10.0.2.0/24 (ALB, NAT), private-app 10.0.11.0/24 & 10.0.12.0/24 (ECS Fargate), and private-db 10.0.21.0/24 & 10.0.22.0/24 (RDS). The third octet tells you the tier; the last digit tells you the AZ.",
  failure: {
    title: "Subnet runs out of IP addresses / overlapping CIDR",
    whatHappens: "When a private-app subnet's 251 addresses are all taken by ECS tasks, ENIs, and endpoints, new tasks fail to launch with an insufficient-free-addresses error, so Auto Scaling cannot add capacity exactly when traffic peaks; the ALB keeps sending requests to the existing tasks, which saturate. An overlapping CIDR fails differently: the peering connection is rejected (or, for VPNs, traffic for the overlapping range stays local), and because the primary CIDR is immutable the only fix is a new VPC and a migration.",
    awsMechanisms: [
      "Subnet AvailableIpAddressCount (visible in the console and DescribeSubnets) for monitoring.",
      "Secondary VPC CIDR association to add address space without rebuilding.",
      "AWS IPAM to allocate, track, and detect overlapping ranges across accounts.",
      "The console/API rejects overlapping subnets and overlapping peering at creation time."
    ],
    mitigations: [
      "Size app subnets for peak task count plus ENIs for endpoints and ALB; prefer /22 if in doubt.",
      "Alarm on ECS service events 'unable to place a task' and on low available IPs.",
      "Add a secondary CIDR and new subnets, then update the ECS service's subnet list, before exhaustion.",
      "Reserve unique ranges per VPC up front so overlaps never happen."
    ]
  },
  beginnerConnectionHint: "CIDR is the numbering system the VPC, subnets, and route tables all speak: the VPC gets the big range, each subnet gets a small slice, and routes say which slices go where."
},
{
  id: "subnets",
  name: "Subnets",
  shortName: "Subnets",
  fullName: "Amazon VPC Subnets",
  category: "networking",
  icon: "🧩",
  tagline: "A slice of the VPC pinned to one AZ — public or private depending only on its route table",
  whatIsIt: "A subnet is a range of IP addresses inside your VPC that lives in exactly one Availability Zone. You launch resources (ECS tasks, EC2 instances, RDS, ALB nodes, NAT Gateways) into subnets, and each subnet is associated with one route table and one network ACL that govern how its traffic moves.",
  eli5: "If the VPC is your house, subnets are the rooms. Each room is on one floor (an Availability Zone) and has its own door rules. Some rooms have a door to the street (public), others only connect to hallways inside the house (private). You put the shop counter in a room with a street door and the safe in a room with none.",
  technical: "A subnet is an AZ-scoped IPv4 (and optionally IPv6) CIDR carved from the VPC CIDR, between /16 and /28, with five addresses reserved by AWS. It is 'public' only if its associated route table contains a route to an Internet Gateway (0.0.0.0/0 → igw-…); otherwise it is private regardless of its name. The 'auto-assign public IPv4' attribute (MapPublicIpOnLaunch) controls whether ENIs launched there receive a public IP by default. Each subnet has exactly one route table association (explicit, or implicitly the main table) and exactly one NACL.",
  whyUse: [
    "Availability: placing the same tier in two subnets in two AZs means an AZ failure removes only part of the fleet.",
    "Tiering: different subnets get different route tables, so the public tier can reach the internet while the database tier cannot.",
    "Blast-radius control: NACLs and route tables are per subnet, so a misconfiguration is contained to one tier.",
    "Required by services: ECS awsvpc tasks, RDS subnet groups, ALB, NAT Gateway, and interface endpoints all ask 'which subnets?' at creation."
  ],
  whenToUse: [
    "Public subnets (10.0.1.0/24, 10.0.2.0/24): ALB nodes and NAT Gateways — things that need a public IP.",
    "Private-app subnets (10.0.11.0/24, 10.0.12.0/24): ECS Fargate tasks and EC2 instances that must not be reachable from the internet but may call out via NAT.",
    "Private-db subnets (10.0.21.0/24, 10.0.22.0/24): RDS instances and caches with no internet route at all.",
    "Interface endpoints and Lambda-in-VPC ENIs: place them in the private-app subnets so they share the app tier's routes."
  ],
  whenNotToUse: [
    "Putting application servers in public subnets with public IPs 'so we can SSH': keep them private and use SSM Session Manager (or a bastion) as the alternative.",
    "One subnet per AZ for everything: use separate tiers so the database can have a route table with no internet route.",
    "A single subnet in a single AZ for production: RDS Multi-AZ and the ALB both require at least two AZs; single-AZ is acceptable only for dev.",
    "Creating a subnet per microservice: security groups isolate services better; subnets are for AZ placement and route/NACL policy."
  ],
  placement: {
    scope: "vpc-edge",
    subnet: "n/a",
    internetAccessible: false,
    summary: "Subnets are the VPC's internal partitions, each fixed to one AZ. Their public/private nature is not a checkbox — it is purely whether their route table points 0.0.0.0/0 at an Internet Gateway.",
    securityGroup: "Not applicable directly — security groups attach to ENIs of resources inside the subnet, not to the subnet. A subnet's own controls are its NACL and route table.",
    nacl: "Exactly one NACL per subnet (the default allow-all until changed); one NACL can serve many subnets. NACLs are stateless, so both directions plus ephemeral ports must be allowed.",
    routeTable: "Exactly one route table per subnet: public subnets use the public RT (0.0.0.0/0 → igw), private-app subnets use a per-AZ private RT (0.0.0.0/0 → nat in the same AZ), DB subnets use a local-only RT.",
    nat: "Optional. Private-app subnets need a NAT route to download packages, pull public images, or call third-party APIs; DB subnets need none.",
    igw: "Required only for public subnets: an IGW route is the definition of 'public'. Private subnets must never have it."
  },
  dataFlow: {
    in: [
      "Packets to resources in the subnet from the ALB (public → private-app), from app tasks (private-app → private-db), or from the internet via the IGW (public only).",
      "Return traffic from the NAT Gateway/IGW and from AWS services via endpoints."
    ],
    out: [
      "Traffic to other subnets via the VPC local route (no gateway involved).",
      "Internet-bound traffic to the IGW (public) or NAT Gateway (private-app).",
      "Flow Logs (subnet-level flow logs are supported) to CloudWatch Logs or S3."
    ]
  },
  networking: [
    "Choose the AZ explicitly and create the same tier in at least two AZs; a subnet cannot be moved to another AZ.",
    "Enable 'auto-assign public IPv4' only on public subnets; leave it off on private subnets so nothing accidentally gets a public IP.",
    "Associate every subnet with an explicit route table; do not rely on the main table.",
    "Subnet CIDRs must not overlap and must be /16–/28; each loses 5 addresses to AWS reservations.",
    "Public IPv4 addresses are billed hourly; the ALB and NAT Gateways are the only resources that need them in the reference design."
  ],
  security: {
    iam: "ec2:CreateSubnet, ec2:ModifySubnetAttribute (auto-assign public IP), ec2:AssociateRouteTable, and ec2:DeleteSubnet are infra-role permissions; at runtime only the ECS/Lambda service roles that create ENIs touch subnets.",
    securityGroups: "Resources in the subnet carry their own SGs: alb-sg in public subnets allows 443 from the internet; ecs-sg in private-app allows the app port only from alb-sg; rds-sg in private-db allows 5432 only from ecs-sg.",
    nacl: "Tighten the DB subnet NACL to allow inbound 5432 from 10.0.11.0/24 and 10.0.12.0/24 and outbound ephemeral 1024–65535 to those ranges; leave public and app subnets on allow-all NACLs unless compliance dictates otherwise.",
    encryption: "Not a subnet property; traffic inside the VPC is protected by TLS at the application layer (ALB → tasks, tasks → RDS).",
    authentication: "Not applicable — a subnet does not authenticate; membership of a subnet must never be treated as identity.",
    authorization: "Subnet placement plus route tables decide reachability (can it get to the internet? to the DB tier?); SGs decide per-resource allow rules.",
    secrets: "None. Subnet IDs are configuration, not secrets; store them in Terraform outputs or SSM Parameter Store for ECS/Lambda to reference.",
    leastPrivilege: "Give each tier the smallest route set: public gets IGW, private-app gets NAT + endpoints, private-db gets local only. Deny ec2:ModifySubnetAttribute to anyone who should not be able to flip auto-assign public IP."
  },
  iam: [
    "Infra/CI role: ec2:CreateSubnet, ec2:DeleteSubnet, ec2:ModifySubnetAttribute, ec2:AssociateRouteTable, ec2:ReplaceNetworkAclAssociation, ec2:CreateTags.",
    "ECS (service-linked role) and Lambda (AWSLambdaVPCAccessExecutionRole) create ENIs in the subnets: ec2:CreateNetworkInterface, ec2:DescribeSubnets, ec2:DeleteNetworkInterface.",
    "Read-only operators: ec2:DescribeSubnets to check AvailableIpAddressCount and route table associations.",
    "Optional: IAM conditions on subnet tags to restrict which teams can launch into which subnets."
  ],
  scaling: [
    "A subnet's capacity is its usable IP count (251 for a /24); each Fargate task, EC2 instance, interface endpoint, ALB node, and NAT Gateway consumes one.",
    "Subnets cannot be resized; add a larger subnet in the same AZ (or in a secondary VPC CIDR) and add it to the ECS service/ASG subnet list.",
    "Adding a third AZ means adding one subnet per tier (10.0.3.0/24, 10.0.13.0/24, 10.0.23.0/24) and a NAT Gateway for it.",
    "ALB nodes scale within the subnets you registered; each ALB subnet must be at least a /27 with at least 8 free IPs."
  ],
  availability: [
    "A subnet is bound to one AZ; if that AZ fails, everything in that subnet is unavailable — this is why every tier has a subnet in two AZs.",
    "The ALB in both public subnets routes traffic to healthy targets in either AZ; ECS spreads tasks across the two private-app subnets.",
    "RDS Multi-AZ uses the DB subnet group (both private-db subnets) to keep the standby in the other AZ.",
    "NAT Gateways are per-AZ; pair each private-app subnet with the NAT in its own AZ so an AZ failure does not cut egress for the surviving AZ."
  ],
  cost: [
    "Subnets are free; you pay for the resources launched in them.",
    "Public IPv4 addresses (auto-assigned or Elastic) are billed hourly, so enable auto-assign only where needed.",
    "Cross-AZ data transfer between subnets in different AZs is charged per GB; same-AZ traffic is free — keep app → DB traffic AZ-local where practical.",
    "Subnet-level Flow Logs add CloudWatch Logs/S3 charges."
  ],
  commonMistakes: [
    "Naming a subnet 'private' but leaving it associated with a main route table that has an IGW route — it is public.",
    "Leaving auto-assign public IPv4 on for app subnets, giving every ECS task a public IP (and a bill).",
    "Creating both subnets of a tier in the same AZ, defeating Multi-AZ.",
    "Forgetting that the RDS subnet group and the ALB both need subnets in at least two AZs, then failing at creation.",
    "Pointing a private subnet in AZ-b at the NAT Gateway in AZ-a (works until AZ-a fails, and pays cross-AZ transfer).",
    "Undersizing app subnets (/28) and hitting IP exhaustion during scale-out.",
    "Launching a bastion or admin tool into a DB subnet, which then 'needs' a NAT route and erodes the isolation."
  ],
  bestPractices: [
    "Three tiers × two AZs: public, private-app, private-db in AZ-a and AZ-b.",
    "Explicit route table association for every subnet; the main table stays local-only.",
    "Auto-assign public IP on only for public subnets.",
    "Tag subnets with Tier=public/app/db and AZ so Terraform, ECS, and humans can filter them.",
    "Keep the DB tier in dedicated subnets with a local-only route table and a tightened NACL.",
    "Size app subnets for peak task count; monitor AvailableIpAddressCount.",
    "Register the ALB in both public subnets and the ECS service in both private-app subnets."
  ],
  creationSteps: [
    "Open VPC → Subnets → Create subnet and select the VPC (shop-prod-vpc).",
    "Enter subnet name shop-public-a, choose Availability Zone (e.g. eu-west-1a), and IPv4 CIDR 10.0.1.0/24.",
    "Click 'Add new subnet' and add shop-public-b in eu-west-1b with 10.0.2.0/24.",
    "Add shop-app-a (eu-west-1a, 10.0.11.0/24) and shop-app-b (eu-west-1b, 10.0.12.0/24).",
    "Add shop-db-a (eu-west-1a, 10.0.21.0/24) and shop-db-b (eu-west-1b, 10.0.22.0/24), then click Create subnet.",
    "Select shop-public-a → Actions → Edit subnet settings → tick 'Enable auto-assign public IPv4 address'; repeat for shop-public-b only.",
    "On the Route table tab of each subnet, click Edit route table association and attach the correct table (public, private-a/b, db).",
    "On the Network ACL tab of the two DB subnets, associate the tightened db-nacl (optional).",
    "Verify each subnet shows 251 available IPs and the expected route table; confirm the private subnets have no igw route.",
    "Create the RDS DB subnet group from shop-db-a/b and register the ALB in shop-public-a/b."
  ],
  productionRecommendations: [
    "Two AZs for every tier; never a single-AZ production subnet.",
    "Auto-assign public IPv4 enabled only on public subnets.",
    "Explicit route table per subnet; verify no private subnet has an IGW route.",
    "/24 or larger for private-app subnets.",
    "Tags for tier and AZ; subnet IDs exported for the ECS, ALB, and RDS modules."
  ],
  configExample: {
    title: "Terraform — six subnets (public, app, db × two AZs)",
    lang: "hcl",
    code: `locals {
  azs = ["eu-west-1a", "eu-west-1b"]
  tiers = {
    public = { cidrs = ["10.0.1.0/24", "10.0.2.0/24"],   public_ip = true  }
    app    = { cidrs = ["10.0.11.0/24", "10.0.12.0/24"], public_ip = false }
    db     = { cidrs = ["10.0.21.0/24", "10.0.22.0/24"], public_ip = false }
  }
  # keys: public-a, public-b, app-a, app-b, db-a, db-b
  subnets = merge([for tier, t in local.tiers : {
    for i, cidr in t.cidrs :
    format("%s-%s", tier, substr(local.azs[i], -1, 1)) => {
      cidr = cidr, az = local.azs[i], tier = tier, public_ip = t.public_ip
    }
  }]...)
}

resource "aws_subnet" "this" {
  for_each                = local.subnets
  vpc_id                  = aws_vpc.shop.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = each.value.public_ip   # true only for the public tier

  tags = { Name = format("shop-%s", each.key), Tier = each.value.tier }
}`
  },
  productionChecklist: [
    "Six subnets across two AZs, one per tier per AZ.",
    "Each subnet has an explicit route table association.",
    "Only public subnets have a route to the IGW.",
    "Only public subnets auto-assign public IPv4.",
    "DB subnets have a local-only route table.",
    "Private-app subnets are /24 or larger with free-IP monitoring.",
    "RDS DB subnet group uses both DB subnets; ALB uses both public subnets; ECS service uses both app subnets.",
    "Subnets tagged with Tier and AZ."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "A subnet is a slice of a VPC's CIDR." },
    { id: "cidr", kind: "required", why: "Each subnet needs a non-overlapping /16–/28 range from the VPC." },
    { id: "route-tables", kind: "required", why: "The associated route table decides whether the subnet is public or private." },
    { id: "security-groups", kind: "recommended", why: "Resources launched in the subnet carry SGs; subnets themselves do not." },
    { id: "nacl", kind: "optional", why: "One NACL per subnet; default allow-all unless tightened." },
    { id: "igw", kind: "optional", why: "Only public subnets need a route to it." },
    { id: "nat-gateway", kind: "optional", why: "Private-app subnets route outbound traffic through it." }
  ],
  related: ["vpc", "cidr", "route-tables", "nacl", "igw", "nat-gateway"],
  ecommerceRole: "The shop has six subnets: public-a/b hold the ALB nodes and NAT Gateways, app-a/b hold the ECS Fargate tasks (and optional EC2), db-a/b hold the RDS primary and Multi-AZ standby. Two of everything so losing an AZ halves capacity instead of ending the sale.",
  failure: {
    title: "Subnet's Availability Zone fails",
    whatHappens: "A subnet cannot fail on its own — it is a configuration object — but its AZ can. When AZ-a is impaired, every resource in shop-public-a, shop-app-a, and shop-db-a becomes unreachable at once: the ALB stops routing to AZ-a targets after health checks fail, ECS re-launches tasks into shop-app-b, RDS fails over to the standby in shop-db-b, and any private subnet in AZ-b that was routing through the AZ-a NAT Gateway loses outbound internet access. Capacity is halved until Auto Scaling replaces tasks in the surviving AZ.",
    awsMechanisms: [
      "ALB health checks stop sending traffic to unhealthy targets in the failed AZ.",
      "The ECS service scheduler replaces failed tasks in the remaining registered subnets.",
      "RDS Multi-AZ automatic failover to the standby in the other DB subnet.",
      "Auto Scaling group AZ rebalancing for EC2-based capacity."
    ],
    mitigations: [
      "Every tier in two AZs; register both subnets with the ALB, ECS service, and DB subnet group.",
      "One NAT Gateway per AZ with a per-AZ private route table so egress is AZ-independent.",
      "Run at least two tasks per service so one AZ's loss does not mean zero tasks; size for N+1 capacity.",
      "Test by deregistering one AZ's subnets from the ALB/ECS service in staging and watching recovery."
    ]
  },
  beginnerConnectionHint: "Subnets are where things actually get placed: the ALB and NAT live in the public ones, ECS tasks in the app ones, RDS in the DB ones, and each subnet's route table decides whether it can reach the internet."
},
{
  id: "route-tables",
  name: "Route Tables",
  shortName: "Route Tables",
  fullName: "Amazon VPC Route Tables",
  category: "networking",
  icon: "🗺️",
  tagline: "The signposts of the VPC — each subnet's rules for where packets go next",
  whatIsIt: "A route table is a set of rules (routes) that decides where network traffic from a subnet is sent, based on the destination IP. Every VPC has a main route table, you can create custom ones, and each subnet is associated with exactly one. Routes point destinations such as 0.0.0.0/0 at targets such as an Internet Gateway, a NAT Gateway, a VPC endpoint, a peering connection, or a Transit Gateway.",
  eli5: "A route table is the set of signposts at a crossroads. When a letter leaves a room, the signpost says: 'addresses inside this house — walk down the hallway; anything else — go out the front door' (or 'hand it to the helper who posts letters for you'). Rooms with a signpost to the front door are public; rooms whose signposts only point inside are private.",
  technical: "Route tables are Layer 3 forwarding tables evaluated per subnet using longest-prefix match. Every table contains a local route for the VPC CIDR (10.0.0.0/16 → local) that is created automatically and cannot be deleted. The main route table is used implicitly by subnets without an explicit association; custom tables are associated explicitly. Typical targets: igw-… (Internet Gateway), nat-… (NAT Gateway), vpce-… (gateway endpoint, whose destination is an AWS-managed prefix list pl-…), pcx-… (peering), tgw-… (Transit Gateway), vgw-… (VPN, optionally with route propagation). One table can be associated with many subnets, but a subnet has exactly one table.",
  whyUse: [
    "Defines public vs private: the presence of 0.0.0.0/0 → igw is what makes a subnet public.",
    "Controls the egress path: private subnets send internet traffic to a NAT Gateway, DB subnets send it nowhere.",
    "Steers AWS service traffic privately: gateway endpoint routes send S3/DynamoDB traffic across the AWS network instead of through NAT.",
    "Connects networks: routes to peering connections, Transit Gateway, or VPN reach other VPCs and on-premises."
  ],
  whenToUse: [
    "Public RT (both public subnets): 10.0.0.0/16 → local, 0.0.0.0/0 → igw.",
    "Private-app RT, one per AZ: 10.0.0.0/16 → local, 0.0.0.0/0 → the NAT Gateway of that AZ, pl-s3/pl-dynamodb → vpce.",
    "DB RT (both DB subnets): 10.0.0.0/16 → local only — no default route.",
    "Adding a peering connection to a shared-services VPC: add 10.20.0.0/16 → pcx-… to the tables of the subnets that need it."
  ],
  whenNotToUse: [
    "Using the main route table for real subnets: leave it local-only as a safe default and create custom tables; a stray IGW route on the main table makes every new subnet public.",
    "One shared private route table for both AZs pointing at a single NAT Gateway: it works but couples AZ-b to AZ-a's NAT (failure + cross-AZ cost); the recommended alternative is one private RT per AZ.",
    "Trying to block traffic with route tables: they only choose paths and cannot deny by port or source — use security groups and NACLs for filtering.",
    "Adding a 0.0.0.0/0 route to the DB route table 'for patching': RDS patches itself through AWS channels; for self-managed databases on EC2 the alternative is an interface endpoint or a tightly scoped NAT route."
  ],
  placement: {
    scope: "vpc-edge",
    subnet: "n/a",
    internetAccessible: false,
    summary: "Route tables are VPC-level control-plane objects, not deployed into a subnet; instead each subnet is associated with one of them. They determine whether traffic leaving a subnet goes to the IGW, a NAT Gateway, an endpoint, another VPC, or stays local.",
    securityGroup: "Not applicable — route tables have no security group and do not filter. SGs attach to ENIs; route tables only pick the next hop.",
    nacl: "Not applicable — NACLs and route tables are independent subnet attachments; a route can exist while a NACL still blocks the traffic, and vice versa.",
    routeTable: "This is the route table. Public RT: 0.0.0.0/0 → igw. Private-app RT per AZ: 0.0.0.0/0 → nat (same AZ) plus prefix-list routes to gateway endpoints. DB RT: local route only.",
    nat: "Referenced as a target: private-app route tables point 0.0.0.0/0 at the NAT Gateway in the same AZ.",
    igw: "Referenced as a target: only the public route table has 0.0.0.0/0 → igw. Any subnet associated with it becomes public."
  },
  dataFlow: {
    in: [
      "Every packet leaving an ENI in an associated subnet is matched against the table's routes.",
      "Optional propagated routes from a Virtual Private Gateway (VPN/Direct Connect) if propagation is enabled."
    ],
    out: [
      "A forwarding decision: local (stay in the VPC), igw, nat, vpce, pcx, tgw, or drop (no matching route).",
      "No logs of their own; outcomes appear indirectly in VPC Flow Logs and Reachability Analyzer."
    ]
  },
  networking: [
    "The local route (VPC CIDR → local) is created automatically in every table and cannot be deleted; it covers all subnet-to-subnet traffic.",
    "Routes are chosen by longest-prefix match: 10.0.0.0/16 → local beats 0.0.0.0/0 → igw for internal destinations.",
    "Gateway endpoints add a route whose destination is a managed prefix list (pl-…) for S3 or DynamoDB and whose target is vpce-…; you choose which tables get it.",
    "A subnet can be associated with only one route table; one table can serve many subnets.",
    "Default quotas: 200 route tables per VPC and 50 non-propagated routes per table (adjustable)."
  ],
  security: {
    iam: "ec2:CreateRouteTable, ec2:CreateRoute, ec2:ReplaceRoute, ec2:DeleteRoute, ec2:AssociateRouteTable, and ec2:ReplaceRouteTableAssociation are infra-only actions; nothing at runtime needs them.",
    securityGroups: "Independent layer: routes decide the path, SGs decide whether the ENI accepts/sends. Both must permit the flow.",
    nacl: "Independent layer: a NACL can block traffic the route table would otherwise forward; remember NACLs are stateless.",
    encryption: "Not applicable — route tables do not carry data. Routing over peering/Transit Gateway stays on the AWS backbone; VPN routes are IPsec-encrypted by the VPN itself.",
    authentication: "Not applicable — route tables do not authenticate anything.",
    authorization: "Routes are coarse network authorization: no default route in the DB table means the DB tier cannot reach the internet no matter what an SG allows. Gateway endpoint policies further restrict which buckets/tables the vpce route can reach.",
    secrets: "None.",
    leastPrivilege: "Give each tier only the routes it needs; deny ec2:CreateRoute/ReplaceRoute to non-infra roles, and use an AWS Config rule or CI check that alerts on 0.0.0.0/0 → igw appearing in a private table."
  },
  iam: [
    "Infra/CI role: ec2:CreateRouteTable, ec2:CreateRoute, ec2:ReplaceRoute, ec2:DeleteRoute, ec2:AssociateRouteTable, ec2:DisassociateRouteTable, ec2:ReplaceRouteTableAssociation, ec2:CreateTags.",
    "Creating a gateway endpoint adds routes on your behalf: ec2:CreateVpcEndpoint plus ec2:ModifyVpcEndpoint to add/remove route tables.",
    "Read-only: ec2:DescribeRouteTables for audits and for Reachability Analyzer troubleshooting.",
    "Optional guardrail: an AWS Config custom rule or IAM condition that prevents non-infra roles from creating 0.0.0.0/0 routes."
  ],
  scaling: [
    "Route tables are AWS-managed metadata; they add no latency or throughput limit.",
    "Adding a third AZ means one more private-app route table pointing at that AZ's NAT Gateway.",
    "Large hub-and-spoke designs move to Transit Gateway so each VPC needs a single summarised route (e.g. 10.0.0.0/8 → tgw) instead of one per peer.",
    "The default limit of 50 routes per table matters when peering with many VPCs; Transit Gateway or summarised CIDRs solve it."
  ],
  availability: [
    "Route tables are regional control-plane objects with no availability to manage; they do not fail on their own.",
    "What varies is the target: an IGW target is regionally redundant, a NAT Gateway target is AZ-local — hence one private table per AZ.",
    "If a NAT Gateway fails, you can point the affected table at the other AZ's NAT (ReplaceRoute) as a manual or scripted fallback.",
    "Reachability Analyzer can validate path assumptions before and after changes."
  ],
  cost: [
    "Route tables and routes are free.",
    "They influence cost heavily: a route to a gateway endpoint makes S3/DynamoDB traffic free of NAT data-processing charges.",
    "Pointing AZ-b subnets at an AZ-a NAT Gateway adds cross-AZ data transfer charges on every byte."
  ],
  commonMistakes: [
    "Forgetting to associate a subnet, so it silently uses the main table (which someone gave an IGW route).",
    "Adding 0.0.0.0/0 → igw to a private route table while debugging and never removing it.",
    "Attaching the S3 gateway endpoint to only one private route table, so AZ-b still pays for NAT.",
    "Expecting a route table to block traffic; it cannot — it only routes.",
    "One private route table for both AZs pointed at one NAT Gateway.",
    "Creating an IGW route before attaching the IGW to the VPC (the console rejects it; Terraform ordering issues surface as apply errors).",
    "Deleting a NAT Gateway but leaving its route, which shows as 'blackhole' and drops all egress."
  ],
  bestPractices: [
    "Four tables in the reference design: public, private-a, private-b, db — each named and tagged.",
    "Keep the main route table local-only and unused by real subnets.",
    "Attach gateway endpoints for S3 and DynamoDB to every private table.",
    "One private table per AZ pointing at that AZ's NAT Gateway.",
    "Define routes in Terraform with explicit depends_on for the IGW attachment.",
    "Use Reachability Analyzer or a smoke test after any route change.",
    "Alarm on blackhole routes with AWS Config or a scheduled describe-route-tables check."
  ],
  creationSteps: [
    "Open VPC → Route tables → Create route table; name it shop-public-rt and select the VPC.",
    "Open shop-public-rt → Routes → Edit routes → Add route: destination 0.0.0.0/0, target Internet Gateway → shop-igw; Save.",
    "Subnet associations → Edit subnet associations → tick shop-public-a and shop-public-b; Save.",
    "Create shop-private-a-rt; add route 0.0.0.0/0 → NAT Gateway → the NAT in shop-public-a; associate shop-app-a.",
    "Create shop-private-b-rt; add route 0.0.0.0/0 → NAT Gateway → the NAT in shop-public-b; associate shop-app-b.",
    "Create shop-db-rt; add no routes (local only); associate shop-db-a and shop-db-b.",
    "Go to Endpoints → Create endpoint → S3 (Gateway type) and select shop-private-a-rt and shop-private-b-rt; the pl-… → vpce-… routes appear automatically. Repeat for DynamoDB.",
    "Open Your VPCs → shop-prod-vpc → Main route table and confirm it contains only the local route.",
    "Check every subnet's Route table tab shows the intended explicit association.",
    "Verify: from an ECS task in shop-app-a, call an external API (via NAT) and list an S3 bucket (via the endpoint); confirm the DB subnets cannot reach the internet."
  ],
  productionRecommendations: [
    "Public, private-per-AZ, and DB route tables — never the main table.",
    "Gateway endpoints attached to all private tables.",
    "Each private table targets the NAT Gateway in its own AZ.",
    "DB table: local route only.",
    "Alert on blackhole routes and on internet routes appearing outside the public table."
  ],
  configExample: {
    title: "Terraform — public, per-AZ private, and DB route tables",
    lang: "hcl",
    code: `resource "aws_route_table" "public" {
  vpc_id = aws_vpc.shop.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.shop.id
  }
  tags = { Name = "shop-public-rt" }
}

# One private table per AZ -> the NAT Gateway in the SAME AZ
resource "aws_route_table" "private" {
  for_each = { a = aws_nat_gateway.this["a"].id, b = aws_nat_gateway.this["b"].id }
  vpc_id   = aws_vpc.shop.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = each.value
  }
  tags = { Name = format("shop-private-%s-rt", each.key) }
}
# DB tier: only the automatic local route (10.0.0.0/16 -> local)
resource "aws_route_table" "db" {
  vpc_id = aws_vpc.shop.id
  tags   = { Name = "shop-db-rt" }
}

resource "aws_route_table_association" "app_a" {
  subnet_id      = aws_subnet.this["app-a"].id
  route_table_id = aws_route_table.private["a"].id
}
# ...same for public-a/b -> public, app-b -> private["b"], db-a/b -> db`
  },
  productionChecklist: [
    "Main route table is local-only and has no subnet associations.",
    "Public route table: 0.0.0.0/0 → igw, associated only with the two public subnets.",
    "Private-a and private-b tables: 0.0.0.0/0 → the NAT Gateway in the same AZ.",
    "DB route table: local route only.",
    "S3 and DynamoDB gateway endpoint routes present in both private tables.",
    "No blackhole routes.",
    "Route changes go through Terraform and review; Reachability Analyzer or smoke test after each change."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "Route tables belong to a VPC and always contain its local route." },
    { id: "subnets", kind: "required", why: "Each subnet is associated with exactly one route table." },
    { id: "cidr", kind: "required", why: "Route destinations are CIDR blocks or prefix lists." },
    { id: "igw", kind: "recommended", why: "Target of the public table's default route." },
    { id: "nat-gateway", kind: "recommended", why: "Target of the private-app tables' default route." },
    { id: "s3", kind: "optional", why: "A gateway endpoint route keeps S3 traffic off the NAT." },
    { id: "dynamodb", kind: "optional", why: "A gateway endpoint route keeps DynamoDB traffic off the NAT." }
  ],
  related: ["subnets", "igw", "nat-gateway", "vpc", "nacl", "security-groups"],
  ecommerceRole: "Four tables run the shop: public (ALB/NAT subnets → IGW), private-a and private-b (ECS subnets → their own AZ's NAT Gateway plus S3/DynamoDB endpoints), and db (local only, so RDS can never reach the internet).",
  failure: {
    title: "Route table has a wrong or missing route",
    whatHappens: "Routing errors are silent: packets are dropped with no error message to the sender. If the private-app table loses its 0.0.0.0/0 → nat route (or the NAT is deleted, leaving a blackhole), ECS tasks can no longer pull images from public registries, call payment/shipping APIs, or reach AWS services that lack an endpoint — deployments hang and checkout calls time out, while traffic from the ALB still works because that is local. If the public table loses its IGW route, the ALB nodes can no longer receive internet traffic and the site goes down. If someone adds an IGW route to the DB table, RDS is still not reachable (no public IP), but the isolation guarantee is gone.",
    awsMechanisms: [
      "Blackhole status is shown on routes whose target no longer exists.",
      "VPC Reachability Analyzer explains why a path fails, naming the route table.",
      "VPC Flow Logs show traffic that never completes (SYNs without replies).",
      "AWS Config records every route change for audit and can trigger remediation."
    ],
    mitigations: [
      "Manage routes only through Terraform with code review; alert on drift.",
      "Synthetic check from each private subnet (a scheduled Lambda or ECS task calling a known endpoint) to catch egress loss.",
      "Gateway endpoints for S3/DynamoDB so a NAT or route failure does not stop image layers in S3 and data access.",
      "Runbook: ReplaceRoute to the other AZ's NAT Gateway if one NAT's route blackholes."
    ]
  },
  beginnerConnectionHint: "Every subnet asks its route table 'where does this packet go?' — to another subnet (local), out the Internet Gateway (public), through the NAT Gateway (private-app), through an endpoint to S3, or nowhere (DB)."
},
{
  id: "igw",
  name: "Internet Gateway",
  shortName: "IGW",
  fullName: "Amazon VPC Internet Gateway",
  category: "networking",
  icon: "🌐",
  tagline: "The VPC's front door to the internet — redundant, no bandwidth limit, one per VPC",
  whatIsIt: "An Internet Gateway is a horizontally scaled, redundant, highly available VPC component that allows communication between resources in your VPC and the internet. It provides a target for internet-bound routes and performs one-to-one network address translation between an instance's private IP and its public or Elastic IP. A VPC can have one IGW attached.",
  eli5: "The Internet Gateway is the front door of your house that opens onto the street. Only rooms whose signposts point to the front door can send or receive visitors from outside, and only if the person inside has a proper street address. AWS keeps the door strong and always working — you never have to fix it.",
  technical: "The IGW is a logical, regionally redundant gateway attached to exactly one VPC (and a VPC can attach only one IGW); AWS states it imposes no availability risk or bandwidth constraints on traffic. For IPv4 it performs 1:1 NAT: outbound packets have their source rewritten from the ENI's private IP to its associated public/Elastic IP, and inbound packets to that public IP are rewritten to the private IP (the OS only ever sees the private address). For IPv6 (globally unique addresses) it forwards without NAT; an egress-only Internet Gateway is the IPv6 equivalent of a NAT Gateway. Four conditions must all hold for internet access: IGW attached, a route to it in the subnet's table, a public/Elastic IP on the ENI, and SG/NACL rules that allow the traffic.",
  whyUse: [
    "Lets internet users reach public-facing resources — in the reference design, the ALB nodes in the public subnets.",
    "Gives public-subnet resources (NAT Gateways, bastions) a path to the internet.",
    "Fully managed: no instances to patch, no capacity to plan, no single point of failure to design around.",
    "Free: the gateway itself has no hourly charge; you pay only standard data-transfer-out rates."
  ],
  whenToUse: [
    "Any VPC that hosts an internet-facing ALB/NLB: attach one IGW and route the public subnets to it.",
    "Public subnets that host NAT Gateways: the NAT itself needs the IGW to reach the internet.",
    "Public EC2 instances such as a bastion (prefer SSM Session Manager) or internet-facing NLB targets.",
    "IPv6-enabled VPCs that must accept inbound IPv6 connections."
  ],
  whenNotToUse: [
    "Giving private application servers direct internet access by putting them in public subnets: use a NAT Gateway from private subnets instead so nothing can initiate connections to them.",
    "Outbound-only access for private subnets: that is the NAT Gateway's job (or an egress-only IGW for IPv6); the IGW alone does not help private-IP-only resources.",
    "Reaching AWS services from private subnets: VPC endpoints keep traffic private and avoid NAT; the IGW is unnecessary for that.",
    "A fully private VPC (compliance) with no internet ingress or egress: do not attach an IGW at all; use endpoints, VPN, or Direct Connect."
  ],
  placement: {
    scope: "vpc-edge",
    subnet: "n/a",
    internetAccessible: true,
    summary: "The IGW attaches to the VPC as a whole, not to a subnet or AZ. It is the boundary between the VPC and the public internet; subnets whose route tables point 0.0.0.0/0 at it are public.",
    securityGroup: "Not applicable — the IGW has no security group and does no filtering. Security groups on the resources behind it (alb-sg allowing 443 from 0.0.0.0/0) decide what is admitted.",
    nacl: "Not applicable to the IGW itself; the public subnets' NACLs are evaluated on traffic passing through it (default allow-all, or allow 80/443 inbound plus ephemeral ports if tightened).",
    routeTable: "The public route table must have 0.0.0.0/0 → igw-…. Private-app and DB tables must not. The IGW must be attached before the route can be created.",
    nat: "Not required by the IGW; instead the NAT Gateway requires the IGW — NAT sits in a public subnet and forwards through it.",
    igw: "This is the IGW: exactly one per VPC, attached once. Detaching it removes all internet ingress and egress (including NAT) for the whole VPC."
  },
  dataFlow: {
    in: [
      "Inbound HTTPS from CloudFront (or direct clients) to the ALB's public IPs, translated to the ALB nodes' private IPs.",
      "Return traffic for outbound connections initiated by the NAT Gateways or public instances."
    ],
    out: [
      "Responses from the ALB to internet clients, source-translated to the ALB's public IPs.",
      "Outbound connections from the NAT Gateways' Elastic IPs (on behalf of private subnets).",
      "No logs of its own; see VPC Flow Logs on the public subnets."
    ]
  },
  networking: [
    "Create the IGW, then attach it to the VPC; an IGW can be attached to only one VPC and a VPC can have only one IGW.",
    "Add 0.0.0.0/0 → igw to the public route table only.",
    "Resources need a public IPv4 or Elastic IP to be reachable; enable auto-assign public IP on the public subnets or allocate an EIP.",
    "Security groups and NACLs must allow the traffic; the IGW itself never blocks or permits anything.",
    "For IPv6, add ::/0 → igw for inbound+outbound or ::/0 → eigw (egress-only Internet Gateway) for outbound-only."
  ],
  security: {
    iam: "ec2:CreateInternetGateway, ec2:AttachInternetGateway, ec2:DetachInternetGateway, and ec2:DeleteInternetGateway are infra-only; consider an SCP that denies AttachInternetGateway in accounts that must stay private.",
    securityGroups: "All filtering happens on the resources behind the IGW: alb-sg allows 443 (and 80 for redirect) from 0.0.0.0/0; nothing else in the VPC should allow inbound from 0.0.0.0/0.",
    nacl: "The public subnet NACL can be tightened to inbound 80/443 from 0.0.0.0/0 plus inbound ephemeral 1024–65535 for NAT return traffic, with matching outbound rules.",
    encryption: "The IGW does not terminate TLS; clients' HTTPS connections pass through to the ALB (which holds the ACM certificate) or to CloudFront in front of it.",
    authentication: "Not applicable — the IGW authenticates nothing; use CloudFront + WAF and the application's own auth.",
    authorization: "Presence of an IGW route is the coarse authorization for internet exposure; keep it in the public route table only and audit for drift.",
    secrets: "None.",
    leastPrivilege: "Only the infra role may create/attach IGWs and add IGW routes; use AWS Config to detect subnets that unexpectedly gain an IGW route."
  },
  iam: [
    "Infra/CI role: ec2:CreateInternetGateway, ec2:AttachInternetGateway, ec2:DetachInternetGateway, ec2:DeleteInternetGateway, ec2:CreateRoute (to add the default route), ec2:CreateTags.",
    "Read-only: ec2:DescribeInternetGateways, ec2:DescribeRouteTables.",
    "Guardrail: an SCP or IAM Deny on ec2:AttachInternetGateway for accounts/VPCs that must remain private."
  ],
  scaling: [
    "Horizontally scaled and redundant by AWS; it does not become a bottleneck and has no bandwidth constraint of its own.",
    "Throughput limits come from the resources behind it: ENI/instance bandwidth, ALB scaling, NAT Gateway capacity.",
    "Nothing to resize or replicate; one IGW serves every AZ in the VPC."
  ],
  availability: [
    "Regionally redundant: AWS states the IGW imposes no availability risk; it is not tied to an AZ.",
    "It has no health metrics or failover configuration; the realistic failure scenarios are misconfiguration (detached IGW, missing route) rather than component failure.",
    "Everything behind it (ALB, NAT) must be Multi-AZ for the VPC's internet-facing service to survive an AZ event."
  ],
  cost: [
    "No hourly charge for the IGW.",
    "Data transfer out to the internet is billed per GB (a small monthly amount is free); inbound is free.",
    "Public IPv4 addresses on resources behind it are billed hourly; CloudFront in front of the ALB reduces direct egress cost."
  ],
  commonMistakes: [
    "Creating the IGW but forgetting to attach it to the VPC, then failing to add the route ('gateway not attached').",
    "Adding the IGW route to the main route table, making every implicitly associated subnet public.",
    "Launching an instance in a public subnet without a public IP and blaming the IGW.",
    "Assuming the IGW gives private subnets outbound access; it does not — they need a NAT Gateway (or endpoints).",
    "Opening security groups to 0.0.0.0/0 on application ports because 'the IGW is the firewall' — it is not.",
    "Confusing IGW (two-way, 1:1 NAT for public IPs, free, regional) with NAT Gateway (outbound-only, many-to-one, needs an EIP, AZ-local, billed hourly and per GB)."
  ],
  bestPractices: [
    "One IGW per VPC, attached in the same Terraform module as the VPC.",
    "Reference it only from the public route table; keep every other table free of it.",
    "Only the ALB and NAT Gateways should have public IPs; application servers stay private.",
    "Put CloudFront + AWS WAF in front of the ALB so the IGW receives filtered traffic.",
    "Use AWS Config or a CI check to detect IGW routes in private tables.",
    "For IPv6 outbound-only needs, use an egress-only Internet Gateway."
  ],
  creationSteps: [
    "Open VPC → Internet gateways → Create internet gateway; name it shop-igw and click Create.",
    "On the success banner (or Actions menu) choose Attach to VPC and select shop-prod-vpc.",
    "Open Route tables → shop-public-rt → Routes → Edit routes → Add route 0.0.0.0/0 with target Internet Gateway → shop-igw; Save.",
    "Confirm shop-public-a and shop-public-b are associated with shop-public-rt and that 'auto-assign public IPv4' is enabled on both.",
    "Create the ALB in the two public subnets with alb-sg (443 from 0.0.0.0/0) — it will get public IPs and be reachable via the IGW.",
    "Create the NAT Gateways in the public subnets; they rely on this IGW for their own internet path.",
    "Verify: resolve the ALB DNS name and curl it from your laptop; confirm the private route tables still have no igw route."
  ],
  productionRecommendations: [
    "Exactly one IGW; referenced only by the public route table.",
    "Public IPs only on ALB nodes and NAT Gateways.",
    "CloudFront + WAF in front of the ALB.",
    "Drift detection for IGW routes in private tables.",
    "Omit the IGW entirely for VPCs that must be fully private."
  ],
  configExample: {
    title: "Terraform — Internet Gateway plus the public default route",
    lang: "hcl",
    code: `resource "aws_internet_gateway" "shop" {
  vpc_id = aws_vpc.shop.id          # attaches to exactly one VPC
  tags   = { Name = "shop-igw" }
}

# Only the PUBLIC route table gets the default route to the IGW
resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.shop.id
}

# Public subnets auto-assign public IPv4 so ALB nodes / NAT are reachable
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.shop.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "eu-west-1a"
  map_public_ip_on_launch = true
  tags                    = { Name = "shop-public-a" }
}`
  },
  productionChecklist: [
    "IGW created and attached to the VPC.",
    "0.0.0.0/0 → igw exists only in the public route table.",
    "Private-app and DB route tables contain no igw route.",
    "Only ALB nodes and NAT Gateways hold public IPs.",
    "alb-sg is the only SG allowing inbound from 0.0.0.0/0 (80/443).",
    "CloudFront + WAF in front of the ALB.",
    "Config rule or CI check alerts on new IGW routes."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "An IGW must be attached to a VPC." },
    { id: "route-tables", kind: "required", why: "Without a 0.0.0.0/0 → igw route nothing uses the gateway." },
    { id: "subnets", kind: "required", why: "Public subnets are the ones whose route table points at the IGW." },
    { id: "security-groups", kind: "required", why: "Traffic through the IGW is admitted only if the target's SG allows it." },
    { id: "alb", kind: "recommended", why: "The internet-facing load balancer is what the IGW exposes in the reference design." },
    { id: "nat-gateway", kind: "recommended", why: "NAT Gateways depend on the IGW for their own internet path." },
    { id: "cloudfront", kind: "recommended", why: "Fronts the ALB so most client traffic hits the edge, not the IGW directly." }
  ],
  related: ["nat-gateway", "route-tables", "subnets", "alb", "cloudfront"],
  ecommerceRole: "The single IGW attached to 10.0.0.0/16 is how CloudFront (and any direct clients) reach the ALB in the public subnets, and how the two NAT Gateways reach the internet on behalf of the ECS tasks. Nothing in the app or DB tiers touches it directly.",
  failure: {
    title: "Internet Gateway route is missing",
    whatHappens: "The IGW itself is redundant and effectively does not fail; the realistic failure is that its route disappears from the public route table, or the IGW is detached. Immediately, the ALB nodes in the public subnets can no longer receive traffic from CloudFront or clients, so the whole storefront returns 5xx/timeouts at the edge. At the same time both NAT Gateways lose their own path to the internet, so ECS tasks in private subnets cannot call external APIs or pull public images; only VPC-endpoint traffic (S3, DynamoDB) and internal traffic keep working.",
    awsMechanisms: [
      "The IGW is horizontally scaled and redundant with no availability risk of its own.",
      "AWS Config records route table and attachment changes; CloudTrail shows who made them.",
      "VPC Reachability Analyzer identifies the missing route between the internet and the ALB ENI.",
      "CloudFront origin 5xx metrics and ALB HealthyHostCount alarms surface the outage."
    ],
    mitigations: [
      "Manage the IGW attachment and route in Terraform; alert on drift or on DeleteRoute/DetachInternetGateway CloudTrail events.",
      "Restrict ec2:DetachInternetGateway and ec2:DeleteRoute to the infra role.",
      "External synthetic monitoring (CloudWatch Synthetics canary) hitting the storefront URL.",
      "Runbook: re-add 0.0.0.0/0 → igw to the public table; verify NAT egress resumes."
    ]
  },
  beginnerConnectionHint: "The Internet Gateway is the one door between the outside world and your VPC: visitors come in through it to reach the ALB, and the NAT Gateway goes out through it on behalf of the private servers."
},
{
  id: "nat-gateway",
  name: "NAT Gateway",
  shortName: "NAT Gateway",
  fullName: "Amazon VPC NAT Gateway",
  category: "networking",
  icon: "🔁",
  tagline: "Lets private subnets reach the internet without letting the internet reach them",
  whatIsIt: "A NAT Gateway is a managed network address translation service. Private servers sometimes need to download updates or call external APIs, but we don't want the internet to directly start a connection to those servers — the NAT Gateway solves exactly that. A public NAT Gateway lives in a public subnet with an Elastic IP; private subnets route 0.0.0.0/0 to it, and only connections initiated from inside are allowed.",
  eli5: "Imagine the kids in the back rooms of a house want to order things from shops in town, but you never want shop people walking into the back rooms. So a trusted grown-up sits by the front door: the kids give the grown-up their orders, the grown-up goes out, uses their own name and address, and brings the parcels back to the right kid. If a stranger comes to the door asking to visit a kid, the grown-up simply says no.",
  technical: "A public NAT Gateway is an AWS-managed, AZ-resident NAT device created in a public subnet and associated with an Elastic IP; it performs many-to-one source NAT with port translation for TCP, UDP, and ICMP traffic from private subnets whose route tables point 0.0.0.0/0 at it, forwarding via the IGW. Only return traffic for connections it initiated is passed back; the internet cannot initiate connections to private instances through it. Each NAT Gateway scales from 5 Gbps to 100 Gbps and supports up to 55,000 simultaneous connections per unique destination (IP, port, protocol); additional Elastic IPs raise that. It is redundant within its AZ but not across AZs. Security groups cannot be attached to a NAT Gateway; the subnet's NACL applies. A private NAT Gateway (no EIP) exists for VPC-to-VPC or on-premises translation.",
  whyUse: [
    "ECS tasks and EC2 instances in private subnets can download OS/package updates, pull public container images, and call third-party APIs (payments, shipping, email).",
    "Inbound protection: no internet host can initiate a connection to a private instance through the NAT, unlike a public IP.",
    "Fully managed: no NAT instance to patch, size, or fail over; AWS handles redundancy within the AZ and scaling up to 100 Gbps.",
    "A stable outbound IP (the Elastic IP) that partners can allowlist."
  ],
  whenToUse: [
    "Private-app subnets running ECS Fargate tasks that call Stripe, shipping carriers, or email APIs.",
    "Lambda functions attached to the VPC that need internet or AWS API access without an interface endpoint.",
    "EC2 instances that need yum/apt updates or to reach public package registries.",
    "Partners who require a fixed source IP: the NAT's Elastic IP is that address."
  ],
  whenNotToUse: [
    "Private subnets that only talk to S3 and DynamoDB: use the free gateway endpoints instead; the NAT is not required.",
    "Heavy ECR image pulls, CloudWatch Logs, Secrets Manager, SQS traffic: interface endpoints (PrivateLink) are the alternative that avoids per-GB NAT charges and keeps traffic private.",
    "The database tier: RDS needs no outbound internet; give the DB route table no default route at all.",
    "Accepting inbound traffic: a NAT Gateway cannot receive connections from the internet; use an ALB/NLB in public subnets.",
    "Tiny dev environments where cost matters more than HA: a self-managed NAT instance on EC2, or simply no NAT, is the cheaper alternative."
  ],
  placement: {
    scope: "vpc",
    subnet: "public",
    internetAccessible: false,
    summary: "The NAT Gateway is created inside a PUBLIC subnet (one per AZ: 10.0.1.0/24 and 10.0.2.0/24) with an Elastic IP; private subnets in the same AZ route 0.0.0.0/0 to it. It has a public IP, but the internet cannot initiate connections through it.",
    securityGroup: "Not applicable — security groups cannot be attached to a NAT Gateway. Control egress on the source resources' SGs (ecs-sg outbound rules) instead.",
    nacl: "The public subnet's NACL applies to NAT traffic: it must allow outbound to 0.0.0.0/0 on the ports your apps use, inbound ephemeral ports (1024–65535) for return traffic, and inbound from the private subnet CIDRs.",
    routeTable: "Two tables matter: the NAT's own public subnet must have 0.0.0.0/0 → igw, and each private-app route table must have 0.0.0.0/0 → nat-… for the NAT in the same AZ. The DB table has no NAT route.",
    nat: "This is the NAT Gateway: one per AZ in production (nat-a in 10.0.1.0/24 serving 10.0.11.0/24; nat-b in 10.0.2.0/24 serving 10.0.12.0/24).",
    igw: "Required. A public NAT Gateway only works in a subnet whose route table points at an attached Internet Gateway; the NAT forwards translated traffic through the IGW."
  },
  dataFlow: {
    in: [
      "Outbound-initiated packets from private-app subnets (ECS tasks, EC2, Lambda-in-VPC) with private source IPs.",
      "Return traffic from the internet for those connections, arriving on the Elastic IP."
    ],
    out: [
      "The same packets forwarded to the IGW with the source rewritten to the NAT's Elastic IP.",
      "Return traffic translated back to the originating private IP and port.",
      "Metrics (BytesOutToDestination, ActiveConnectionCount, ErrorPortAllocation, PacketsDropCount) to CloudWatch."
    ]
  },
  networking: [
    "Create the NAT in a public subnet with an Elastic IP; that subnet's route table must have 0.0.0.0/0 → igw.",
    "Each private-app subnet's route table gets 0.0.0.0/0 → the NAT Gateway in its own AZ.",
    "Supports TCP, UDP, and ICMP; no security groups — use the source resources' SGs and the subnet NACL.",
    "Each NAT supports 55,000 simultaneous connections per destination; associate more Elastic IPs (up to 8) or add NATs if ErrorPortAllocation rises.",
    "Add S3/DynamoDB gateway endpoints and, where economical, interface endpoints so that traffic bypasses the NAT entirely."
  ],
  security: {
    iam: "ec2:CreateNatGateway, ec2:DeleteNatGateway, ec2:AllocateAddress, ec2:ReleaseAddress, and ec2:CreateRoute are infra-only; nothing at runtime needs NAT permissions.",
    securityGroups: "Not attachable to the NAT. Restrict outbound rules on ecs-sg/ec2-sg (e.g. 443 only) so that only intended egress flows reach the NAT.",
    nacl: "The public subnet NACL must permit the NAT's traffic in both directions; a tightened NACL should allow inbound ephemeral ports from 0.0.0.0/0 for return traffic.",
    encryption: "The NAT forwards packets unchanged; applications must use TLS to external APIs. The NAT cannot inspect or decrypt traffic (use AWS Network Firewall if inspection is required).",
    authentication: "Not applicable — the NAT authenticates nothing; partners may allowlist its Elastic IP, but that is not authentication.",
    authorization: "Coarse egress control comes from which route tables point at the NAT (DB tier: none) and from SG outbound rules; domain-level allowlisting requires Network Firewall or a proxy.",
    secrets: "None. The Elastic IP is public knowledge; treat it as configuration to share with partners.",
    leastPrivilege: "Give NAT routes only to tiers that need egress; deny ec2:CreateNatGateway/CreateRoute outside the infra role; prefer endpoints over NAT for AWS services so the NAT's egress surface is only third-party APIs."
  },
  iam: [
    "Infra/CI role: ec2:CreateNatGateway, ec2:DeleteNatGateway, ec2:AllocateAddress, ec2:AssociateNatGatewayAddress, ec2:ReleaseAddress, ec2:CreateRoute, ec2:ReplaceRoute, ec2:CreateTags.",
    "Read-only/operators: ec2:DescribeNatGateways, ec2:DescribeAddresses, cloudwatch:GetMetricData for NAT metrics.",
    "No IAM is involved on the data path: ECS task roles and Lambda execution roles need nothing to send traffic via NAT.",
    "Guardrail: alarm on AllocateAddress/CreateNatGateway CloudTrail events to catch surprise NATs (and surprise bills)."
  ],
  scaling: [
    "Automatically scales bandwidth from 5 Gbps up to 100 Gbps per NAT Gateway; no instance size to choose.",
    "Connection limit: 55,000 simultaneous connections to the same destination IP/port/protocol; adding secondary Elastic IPs (up to 8) multiplies it; ErrorPortAllocation in CloudWatch signals exhaustion.",
    "Scale out by AZ: one NAT per AZ also spreads load; very high egress can use multiple NATs per AZ with separate subnets/route tables.",
    "Reduce load rather than scale it: gateway/interface endpoints remove AWS-service traffic from the NAT."
  ],
  availability: [
    "A NAT Gateway is redundant within its AZ (AWS replaces failed components) but is tied to that AZ; it cannot serve traffic if its AZ is impaired.",
    "Recommended: one NAT per AZ with a private route table per AZ so an AZ failure only affects that AZ's own private subnets.",
    "A single NAT in AZ-a serving AZ-b's private subnets means an AZ-a failure cuts egress for healthy AZ-b tasks — and every byte pays cross-AZ transfer.",
    "Route tables can be repointed (ReplaceRoute) to the surviving NAT as an emergency measure."
  ],
  cost: [
    "Hourly charge per NAT Gateway (roughly $0.045/hour in us-east-1, about $33/month each) — two AZs means two charges.",
    "Data processing per GB through the NAT (roughly $0.045/GB) on top of normal data-transfer-out charges.",
    "Cross-AZ data transfer if private subnets use a NAT in another AZ.",
    "Public IPv4 hourly charge for each NAT's Elastic IP.",
    "Biggest saving: S3 and DynamoDB gateway endpoints are free and remove that traffic; ECR/CloudWatch interface endpoints cost hourly but are usually cheaper than NAT processing for heavy image pulls."
  ],
  commonMistakes: [
    "Creating the NAT Gateway in a private subnet (it has no route to the IGW and nothing works).",
    "One NAT for both AZs: cross-AZ charges plus an AZ-a failure that blacks out AZ-b's egress.",
    "Forgetting the private route table's 0.0.0.0/0 → nat route, then blaming the NAT for timeouts.",
    "Pulling gigabytes of ECR images and S3 objects through the NAT on every deploy instead of using endpoints.",
    "Expecting the NAT to accept inbound connections or to accept a security group.",
    "Leaving NATs running in dev/staging overnight and at weekends (hourly cost) when they could be destroyed.",
    "Ignoring ErrorPortAllocation/PacketsDropCount alarms until connections mysteriously fail under load."
  ],
  bestPractices: [
    "One NAT Gateway per AZ in a public subnet, each with its own Elastic IP; private route table per AZ.",
    "Gateway endpoints for S3 and DynamoDB in every private route table; evaluate interface endpoints for ECR, CloudWatch Logs, Secrets Manager, SQS.",
    "No NAT route for the DB tier.",
    "CloudWatch alarms on ErrorPortAllocation, PacketsDropCount, and BytesOutToDestination spikes (cost).",
    "Tag NATs per environment and tear down non-prod NATs on a schedule if egress is not needed.",
    "Share the Elastic IPs with partners who allowlist; keep them as Terraform-managed EIPs so they survive rebuilds.",
    "Restrict SG outbound rules on app tasks so only intended ports use the NAT."
  ],
  creationSteps: [
    "Open VPC → Elastic IPs → Allocate Elastic IP address; name it shop-nat-a-eip. Repeat for shop-nat-b-eip.",
    "Open VPC → NAT gateways → Create NAT gateway.",
    "Name it shop-nat-a, choose subnet shop-public-a (10.0.1.0/24), Connectivity type = Public, and pick shop-nat-a-eip; click Create.",
    "Repeat for shop-nat-b in shop-public-b (10.0.2.0/24) with shop-nat-b-eip.",
    "Wait for both to show state Available (a minute or two).",
    "Open Route tables → shop-private-a-rt → Edit routes → Add 0.0.0.0/0 → NAT Gateway → shop-nat-a; Save. Do the same for shop-private-b-rt → shop-nat-b.",
    "Confirm shop-public-rt (used by both public subnets) has 0.0.0.0/0 → shop-igw, otherwise the NATs have no internet path.",
    "Add S3 and DynamoDB gateway endpoints to both private route tables so that traffic bypasses the NAT.",
    "Test from an ECS task or instance in shop-app-a: an HTTPS call to an external API succeeds; an inbound connection attempt to the NAT's EIP is dropped.",
    "Create CloudWatch alarms on ErrorPortAllocation and PacketsDropCount for each NAT."
  ],
  productionRecommendations: [
    "One NAT per AZ; never a single shared NAT in production.",
    "Gateway endpoints for S3/DynamoDB to cut NAT bills; interface endpoints for heavy ECR/Logs traffic.",
    "DB subnets have no NAT route.",
    "Alarms on port allocation errors, dropped packets, and bytes processed.",
    "Elastic IPs managed in Terraform and documented for partner allowlists."
  ],
  configExample: {
    title: "Terraform — one NAT Gateway per AZ with EIP and private default routes",
    lang: "hcl",
    code: `locals { nat_azs = { a = "public-a", b = "public-b" } }

resource "aws_eip" "nat" {
  for_each = local.nat_azs
  domain   = "vpc"
  tags     = { Name = format("shop-nat-%s-eip", each.key) }
}

# One NAT Gateway per AZ, each in that AZ's PUBLIC subnet
resource "aws_nat_gateway" "this" {
  for_each      = local.nat_azs
  subnet_id     = aws_subnet.this[each.value].id      # 10.0.1.0/24, 10.0.2.0/24
  allocation_id = aws_eip.nat[each.key].id
  tags          = { Name = format("shop-nat-%s", each.key) }
  depends_on    = [aws_internet_gateway.shop]         # NAT needs the IGW path
}

# Private-app subnets in AZ-a route to nat-a, AZ-b to nat-b
# (alternative to an inline route block in aws_route_table.private)
resource "aws_route" "private_default" {
  for_each               = local.nat_azs
  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[each.key].id
}`
  },
  productionChecklist: [
    "NAT Gateway in each AZ's public subnet with its own Elastic IP.",
    "Private-app route table per AZ points 0.0.0.0/0 at the same-AZ NAT.",
    "Public route table has 0.0.0.0/0 → igw (the NAT's own path).",
    "DB route table has no NAT route.",
    "S3 and DynamoDB gateway endpoints attached to private route tables.",
    "Interface endpoints evaluated for ECR, CloudWatch Logs, Secrets Manager.",
    "Alarms on ErrorPortAllocation, PacketsDropCount, BytesOutToDestination.",
    "Non-prod NATs scheduled/destroyed when idle; costs tagged per environment."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "The NAT Gateway is created inside a VPC subnet." },
    { id: "subnets", kind: "required", why: "Must be placed in a public subnet; serves the private subnets." },
    { id: "igw", kind: "required", why: "A public NAT Gateway forwards through the VPC's Internet Gateway." },
    { id: "route-tables", kind: "required", why: "Private tables need 0.0.0.0/0 → nat; the public table needs 0.0.0.0/0 → igw." },
    { id: "cloudwatch", kind: "recommended", why: "ErrorPortAllocation and PacketsDropCount alarms." },
    { id: "s3", kind: "alternative", why: "A gateway endpoint gives private S3 access with no NAT at all." },
    { id: "dynamodb", kind: "alternative", why: "A gateway endpoint gives private DynamoDB access with no NAT at all." },
    { id: "ecr", kind: "optional", why: "Interface endpoints for ECR avoid NAT charges on image pulls." }
  ],
  related: ["igw", "route-tables", "subnets", "ecs", "lambda", "ecr"],
  ecommerceRole: "Two NAT Gateways (one in 10.0.1.0/24, one in 10.0.2.0/24) let the ECS Fargate tasks in the private-app subnets call the payment, shipping, and email providers and reach AWS services that have no endpoint, while nothing on the internet can open a connection to those tasks. RDS never uses them.",
  failure: {
    title: "NAT Gateway fails or its AZ fails",
    whatHappens: "If nat-a (or all of AZ-a) fails, every private subnet whose route table points at nat-a loses outbound internet access: ECS tasks in 10.0.11.0/24 can no longer call the payment or shipping APIs, new tasks may fail to start if they pull images from public registries, and Lambda-in-VPC functions time out on external calls. Inbound traffic via the ALB and local traffic to RDS keep working, so the site stays up but checkouts that depend on external calls fail. If every private subnet in AZ-b uses nat-b, AZ-b keeps working normally; with a single shared NAT, an AZ-a failure takes egress down for both AZs even though AZ-b's tasks are healthy.",
    awsMechanisms: [
      "Each NAT Gateway is redundant within its AZ; AWS replaces failed underlying capacity automatically.",
      "Per-AZ NAT with per-AZ route tables isolates the failure to one AZ.",
      "CloudWatch metrics (PacketsDropCount, ErrorPortAllocation, ConnectionAttemptCount vs ConnectionEstablishedCount) and NAT Gateway state for detection.",
      "Gateway/interface endpoints keep S3, DynamoDB, ECR, and other AWS traffic flowing without the NAT."
    ],
    mitigations: [
      "Deploy one NAT per AZ and never point a private subnet at a NAT in another AZ.",
      "Use VPC endpoints for AWS services so image pulls and data access survive NAT loss.",
      "Runbook or automation: ReplaceRoute in the affected private table to the surviving AZ's NAT (accepting cross-AZ cost temporarily).",
      "Application-level timeouts, retries, and circuit breakers for external API calls; alarm on PacketsDropCount > 0 and on external-call error rates."
    ]
  },
  beginnerConnectionHint: "The private app servers hand their outgoing requests to the NAT Gateway, which sends them out through the Internet Gateway using its own public address and brings the answers back — but it never lets anyone outside start a conversation with those servers."
});
