/* Compute services — Amazon EC2, Amazon ECS (on Fargate), AWS Lambda (schema: _schema.md, template: database.js) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "ec2",
  name: "Amazon EC2",
  shortName: "EC2",
  fullName: "Amazon Elastic Compute Cloud",
  category: "compute",
  icon: "🖥️",
  tagline: "Resizable virtual servers you fully control, launched into your VPC subnets",
  whatIsIt: "Amazon EC2 provides virtual machines (instances) that run in your VPC subnets. You pick the machine image (AMI), instance type (CPU, memory, network), storage (EBS volumes), and network placement, then manage the operating system and everything installed on it. Auto Scaling groups can launch and replace instances for you across Availability Zones.",
  eli5: "EC2 is like renting a computer that lives in a big building far away. You choose how fast it is and how much memory it has, and it turns on within a minute. You can install anything you want on it, just like your own laptop, and when you do not need it anymore you hand it back and stop paying.",
  technical: "An EC2 instance is a VM on the Nitro hypervisor with one or more Elastic Network Interfaces (ENIs) that receive private IPs from a subnet; security groups attach to the ENI and NACLs apply at the subnet boundary. The root and data volumes are usually EBS (network-attached block storage that persists independently of the instance), while some instance types add ephemeral instance store. Instances assume IAM permissions through an instance profile and fetch temporary credentials from the Instance Metadata Service (IMDSv2). A launch template plus an Auto Scaling group turns individual instances into a self-healing fleet spread across AZs.",
  whyUse: [
    "You need full control of the OS, kernel settings, installed agents, or licensed software that does not fit a container or function model.",
    "Long-running, stateful, or specialised workloads (GPU inference, large in-memory caches, legacy monoliths) that need a specific instance family.",
    "Lift-and-shift migrations where the application already runs on virtual machines and you want to move it before re-architecting.",
    "Predictable, steady load where Reserved Instances or Savings Plans make a fixed fleet cheaper than per-request pricing.",
    "Self-managed components such as a bastion host, a build agent, or a database engine AWS does not offer as a managed service."
  ],
  whenToUse: [
    "Running a legacy monolith or a third-party product that ships as an installer or VM image.",
    "Compute that needs a specific instance type: GPUs for ML inference, high-memory nodes, or local NVMe for scratch I/O.",
    "Background batch jobs on Spot Instances where interruption is acceptable and cost matters.",
    "Hosting the ECS EC2 launch type or self-managed Kubernetes nodes when Fargate limits (GPU, privileged containers, daemon agents) get in the way.",
    "A jump host or admin box reached through SSM Session Manager rather than open SSH."
  ],
  whenNotToUse: [
    "A stateless containerised web API: ECS on Fargate removes host patching, AMI management, and capacity planning.",
    "Event-driven, bursty, or infrequent code (webhooks, image resizing, nightly jobs): Lambda bills per invocation and scales to zero.",
    "Running your own PostgreSQL or MySQL on an instance: RDS gives you backups, patching, and Multi-AZ failover out of the box.",
    "Serving static files or user uploads: S3 (with CloudFront in front) is cheaper and more durable than a web server on a disk.",
    "Message queues or cron schedulers hand-built on an instance: SQS and EventBridge are managed alternatives that do not need a server."
  ],
  placement: {
    scope: "vpc",
    subnet: "private-app",
    internetAccessible: false,
    summary: "In the reference architecture EC2 is optional: application instances (if used) live in the private app subnets 10.0.11.0/24 and 10.0.12.0/24 behind the ALB, launched by an Auto Scaling group across both AZs. Only the ALB in the public subnets has a public address; instances have private IPs only.",
    securityGroup: "Attach an application security group that allows inbound on the app port (e.g. 8080) only from the ALB security group. Do not open port 22 from the internet; use SSM Session Manager for shell access. Outbound is open by default (stateful, so replies are allowed automatically).",
    nacl: "The app subnet NACL can allow inbound from the public (ALB) subnet CIDRs on the app port and ephemeral ports 1024-65535 for return traffic to the internet via NAT. Because NACLs are stateless, both directions must be written explicitly; many teams keep the default allow-all NACL and rely on security groups.",
    routeTable: "The private app route table has 10.0.0.0/16 -> local and 0.0.0.0/0 -> NAT Gateway. There is no route to the Internet Gateway, so nothing on the internet can initiate a connection to the instances.",
    nat: "Required for outbound internet access from private instances: OS package updates, pulling images from ECR, and calling AWS APIs (CloudWatch, SSM, Secrets Manager) unless you add VPC endpoints for those services. One NAT Gateway per AZ is recommended so one AZ failure does not cut off the other AZ.",
    igw: "Not attached directly. The IGW is needed by the VPC for the ALB and NAT Gateway in the public subnets; the instances themselves reach the internet only through NAT. A public instance (public IP + IGW route) is only appropriate for a deliberately exposed host."
  },
  dataFlow: {
    in: [
      "HTTP/HTTPS requests forwarded by the ALB to the instance's app port after the target passes health checks.",
      "Deployment artefacts and container images pulled from S3 or ECR, and configuration and secrets fetched from SSM Parameter Store or Secrets Manager.",
      "Commands from SSM Session Manager / Run Command for operators (no inbound SSH needed).",
      "Temporary IAM credentials delivered through the Instance Metadata Service (IMDSv2) for the instance profile role."
    ],
    out: [
      "SQL queries to RDS on 5432/3306 and item reads/writes to DynamoDB; messages published to SQS/SNS.",
      "Logs and metrics via the CloudWatch agent (CPU, memory, disk, application logs) to CloudWatch.",
      "Outbound internet traffic (package repos, third-party APIs, payment gateways) through the NAT Gateway.",
      "EBS snapshots and AMIs written to AWS-managed S3 storage for backup and fleet rollout."
    ]
  },
  networking: [
    "Each instance gets a primary ENI with a private IP from its subnet; a public IP or Elastic IP is optional and only meaningful in a public subnet with an IGW route.",
    "The ALB target group registers instances (target type 'instance') on the app port; the health check path must return 2xx quickly.",
    "Private instances rely on 0.0.0.0/0 -> NAT Gateway for outbound access; add gateway endpoints for S3/DynamoDB and interface endpoints for SSM, ECR, CloudWatch Logs to cut NAT data-processing cost.",
    "Enable 'DNS hostnames' and 'DNS resolution' on the VPC so instances resolve RDS endpoints and AWS service names via the Route 53 Resolver at 10.0.0.2.",
    "Enforce IMDSv2 (metadata token required) so a web SSRF bug cannot steal the instance role credentials."
  ],
  security: {
    iam: "The instance assumes an IAM role via an instance profile; the application then calls AWS APIs with short-lived credentials without any access keys on disk. Operators need ec2:RunInstances, ec2:TerminateInstances, autoscaling:* scoped to tagged resources.",
    securityGroups: "Application security group: inbound app port from the ALB security group only; no 0.0.0.0/0 inbound rules. Security groups are stateful, so return traffic is allowed automatically.",
    nacl: "Optional subnet-level filter around the app tier; if used, remember ephemeral return ports because NACLs are stateless.",
    encryption: "Enable EBS encryption by default in the account (KMS) so every root and data volume and snapshot is encrypted. TLS terminates at the ALB; optionally re-encrypt to the instance on 443.",
    authentication: "No SSH keys in production: use SSM Session Manager (audited in CloudTrail, works from private subnets). Application-to-AWS authentication is the instance role via IMDSv2.",
    authorization: "The instance role policy grants only the APIs the app needs (e.g. s3:GetObject on one bucket, sqs:SendMessage on one queue). Separate roles per application tier rather than one shared 'ec2-role'.",
    secrets: "Fetch database passwords and API keys at boot or runtime from Secrets Manager / SSM Parameter Store (SecureString) using the instance role; never bake them into the AMI or user data, which is readable by anyone with ec2:DescribeInstanceAttribute.",
    leastPrivilege: "One role per fleet, IMDSv2 required, no wildcard resource ARNs, and no inbound rules beyond the ALB security group. Use AWS Systems Manager for patching so operators never need interactive access."
  },
  iam: [
    "Instance profile role for the application: least-privilege access to its S3 bucket, SQS queue, DynamoDB table, and secretsmanager:GetSecretValue on its specific secrets.",
    "AmazonSSMManagedInstanceCore (managed policy) on the instance role so Session Manager, Run Command, and Patch Manager work without SSH.",
    "CloudWatchAgentServerPolicy on the instance role so the CloudWatch agent can publish metrics and logs.",
    "Auto Scaling uses the service-linked role AWSServiceRoleForAutoScaling to launch and terminate instances on your behalf; operators need iam:PassRole for the instance profile role when creating launch templates.",
    "Deployment pipeline: ec2:CreateLaunchTemplateVersion, autoscaling:StartInstanceRefresh, ec2:CreateImage, scoped by tags or resource ARNs."
  ],
  scaling: [
    "Horizontal: an Auto Scaling group with a launch template adds or removes instances across the two AZs using target tracking (e.g. average CPU 50% or ALBRequestCountPerTarget), step scaling on alarms, or scheduled scaling for known peaks such as a flash sale.",
    "Vertical: stop the instance, change the instance type, start it again; this needs a short outage and is not automatic, so prefer horizontal scaling behind the ALB.",
    "Instance refresh rolls out a new AMI or launch template version to the ASG gradually while keeping a minimum healthy percentage in service.",
    "Warm pools keep pre-initialised stopped instances ready so scale-out is not delayed by slow boot scripts.",
    "Mixed instance policies combine On-Demand and Spot across several instance types to increase capacity and lower cost; account-level vCPU quotas cap the maximum fleet size."
  ],
  availability: [
    "A single instance lives in exactly one AZ; run at least two instances in two AZs (min_size = 2 in the ASG) so an AZ event does not take the tier down.",
    "The ASG replaces instances that fail EC2 status checks or ALB health checks (health_check_type = ELB) automatically.",
    "EBS volumes are replicated within their AZ and persist independently of the instance; take regular EBS snapshots (Data Lifecycle Manager) and copy them to another Region for DR.",
    "Simplified automatic recovery moves an instance to healthy hardware after a system status check failure, keeping its instance ID, private IP, and EBS volumes.",
    "Bake immutable AMIs so any instance can be recreated from scratch; treat instances as disposable rather than hand-patched pets."
  ],
  cost: [
    "Instance hours by type and purchase option: On-Demand is the baseline, Savings Plans or Reserved Instances cut steady-state cost significantly, Spot is heavily discounted but interruptible.",
    "EBS storage per GB-month (gp3 is the usual default) plus snapshots; provisioned IOPS/throughput above the gp3 baseline costs extra.",
    "Data transfer: outbound to the internet per GB, cross-AZ traffic per GB (e.g. app in AZ-a talking to RDS in AZ-b), and NAT Gateway hourly plus per-GB data-processing charges.",
    "Public IPv4 addresses are charged hourly, so prefer private instances behind the ALB.",
    "Idle or oversized instances are the most common waste: right-size with CloudWatch metrics and Compute Optimizer recommendations."
  ],
  commonMistakes: [
    "Opening SSH (22) to 0.0.0.0/0 and managing servers by hand instead of using SSM Session Manager and automated deployments.",
    "Putting long-lived access keys on the instance instead of attaching an IAM role via an instance profile.",
    "Leaving IMDSv1 enabled, letting an SSRF vulnerability in the web app read the instance role credentials.",
    "Running one instance in one AZ with no Auto Scaling group; a host failure or AZ event means a full outage.",
    "Storing user uploads or session state on the local disk, then losing them when the ASG replaces the instance.",
    "Placing app instances in public subnets with public IPs 'just to get internet access' instead of using a NAT Gateway.",
    "Hard-coding secrets or database passwords in user data, which is visible to anyone who can describe the instance."
  ],
  bestPractices: [
    "Private app subnets across two AZs, an Auto Scaling group with min 2, and the ALB as the only public entry point.",
    "Launch templates with IMDSv2 required, EBS encryption on, and a least-privilege instance profile role.",
    "Immutable AMIs built by a pipeline (EC2 Image Builder or Packer); deploy by instance refresh, not by SSH-ing into running servers.",
    "SSM Session Manager and Patch Manager instead of SSH keys and manual patching.",
    "CloudWatch agent for memory/disk metrics and application logs; alarms on StatusCheckFailed, CPU, and ALB UnHealthyHostCount.",
    "Keep instances stateless: files in S3, sessions in DynamoDB or a cache, data in RDS.",
    "Use Savings Plans for the baseline fleet and Spot for fault-tolerant batch work; review right-sizing regularly."
  ],
  creationSteps: [
    "Open the AWS Console and go to IAM -> Roles -> Create role; choose 'EC2' as the trusted service, attach AmazonSSMManagedInstanceCore and CloudWatchAgentServerPolicy plus your app policy, and name it shop-app-instance-role (an instance profile is created automatically).",
    "Go to EC2 -> Security Groups -> Create security group named app-sg in the shop VPC; add an inbound rule for TCP 8080 with source = the ALB security group (alb-sg). Do not add an SSH rule.",
    "Go to EC2 -> Launch Templates -> Create launch template; pick the latest Amazon Linux 2023 AMI and an instance type such as t3.medium.",
    "In the launch template, do not assign a key pair and do not enable auto-assign public IP; under Advanced details choose the IAM instance profile shop-app-instance-role and set 'Metadata version' to V2 only (token required).",
    "Under Storage set the root volume to gp3 and enable encryption; under Advanced details paste the user-data script that installs the app (or Docker and pulls the image from ECR).",
    "Go to EC2 -> Auto Scaling Groups -> Create Auto Scaling group; select the launch template and the two private app subnets (10.0.11.0/24 and 10.0.12.0/24).",
    "Attach the group to the existing ALB target group (shop-app-tg), set the health check type to ELB with a grace period of about 120 seconds, and enable group metrics collection.",
    "Set desired = 2, minimum = 2, maximum = 6, and add a target tracking scaling policy on average CPU utilization at 50%.",
    "Review and create the group, then watch EC2 -> Instances until two instances are running in different AZs and show 'healthy' in the target group.",
    "Verify access with EC2 -> Instances -> Connect -> Session Manager (no SSH), and confirm the application responds through the ALB DNS name.",
    "Create CloudWatch alarms for StatusCheckFailed, high CPU, and the target group's UnHealthyHostCount."
  ],
  productionRecommendations: [
    "Instances in private subnets across two AZs, managed by an Auto Scaling group with ELB health checks.",
    "IMDSv2 required, EBS encryption enabled, no SSH key pairs; access only via SSM Session Manager.",
    "Least-privilege instance profile role; secrets from Secrets Manager or SSM Parameter Store at runtime.",
    "Immutable AMIs from a build pipeline; roll out with instance refresh and keep the previous template version for rollback.",
    "CloudWatch agent installed; alarms on status checks, CPU, disk, memory, and unhealthy targets.",
    "Savings Plans for the baseline, Spot for interruptible work, and a monthly right-sizing review."
  ],
  configExample: {
    title: "Terraform — launch template with user data + Auto Scaling group in private app subnets",
    lang: "hcl",
    code: `resource "aws_launch_template" "app" {
  name_prefix   = "shop-app-"
  image_id      = data.aws_ssm_parameter.al2023_ami.value   # latest Amazon Linux 2023 AMI
  instance_type = "t3.medium"
  vpc_security_group_ids = [aws_security_group.app.id]      # inbound 8080 from alb-sg only, no SSH
  iam_instance_profile { name = aws_iam_instance_profile.app.name }  # SSM + CloudWatch + app perms
  metadata_options { http_tokens = "required" }             # enforce IMDSv2
  # root volume encrypted via account-wide EBS encryption by default (aws ec2 enable-ebs-encryption-by-default)
  user_data = base64encode(<<-EOT
    #!/bin/bash
    set -euo pipefail
    dnf install -y docker amazon-cloudwatch-agent && systemctl enable --now docker
    aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.eu-west-1.amazonaws.com
    docker run -d --restart=always -p 8080:8080 123456789012.dkr.ecr.eu-west-1.amazonaws.com/shop-api:1.4.2
  EOT
  )
}

resource "aws_autoscaling_group" "app" {
  min_size                  = 2
  max_size                  = 6
  vpc_zone_identifier       = [aws_subnet.app_a.id, aws_subnet.app_b.id]  # 10.0.11.0/24, 10.0.12.0/24
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 120
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
}`
  },
  productionChecklist: [
    "Instances run in private app subnets in at least 2 AZs behind the ALB.",
    "Auto Scaling group with min >= 2 and ELB health checks; scaling policy configured.",
    "Security group allows the app port only from the ALB security group; no port 22 open.",
    "IMDSv2 required in the launch template.",
    "IAM role via instance profile; no access keys on the instance.",
    "EBS volumes encrypted; snapshots scheduled via Data Lifecycle Manager.",
    "SSM agent running; access via Session Manager only.",
    "CloudWatch agent installed; alarms on StatusCheckFailed, CPU, disk, memory.",
    "AMI built by a pipeline and patched on a schedule; rollout via instance refresh.",
    "Instances are stateless; no user data or sessions stored on local disk."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "Instances are launched into a subnet of a VPC and receive their private IPs from it." },
    { id: "subnets", kind: "required", why: "Private app subnets in two AZs determine where the ASG places instances." },
    { id: "security-groups", kind: "required", why: "Firewall on the instance ENI: app port from the ALB only, no public SSH." },
    { id: "iam", kind: "required", why: "Instance profile role gives the application AWS permissions without access keys." },
    { id: "route-tables", kind: "required", why: "The private route table sends 0.0.0.0/0 to the NAT Gateway for outbound access." },
    { id: "nat-gateway", kind: "recommended", why: "Outbound access for updates, ECR pulls, and AWS APIs from private subnets (or use VPC endpoints)." },
    { id: "auto-scaling", kind: "recommended", why: "Replaces failed instances and scales the fleet across AZs." },
    { id: "alb", kind: "recommended", why: "The only public entry point; forwards requests to healthy instances and runs health checks." },
    { id: "cloudwatch", kind: "recommended", why: "Metrics, logs, and alarms for the instances and scaling policies." },
    { id: "nacl", kind: "optional", why: "Extra stateless filtering at the subnet boundary." },
    { id: "ecs", kind: "alternative", why: "Run the same application as containers on Fargate without managing hosts." },
    { id: "lambda", kind: "alternative", why: "Event-driven or bursty code without any servers to manage." }
  ],
  related: ["ecs", "lambda", "auto-scaling", "alb", "security-groups", "subnets", "nat-gateway", "iam"],
  ecommerceRole: "Optional in the reference platform: a small EC2 Auto Scaling group in the private app subnets can host a legacy or specialised component (for example a search indexer or licensed software) behind the same ALB, while the main API runs on ECS Fargate. It also serves as an admin host reached through SSM rather than SSH.",
  failure: {
    title: "EC2 instance fails",
    whatHappens: "If the underlying host has a problem, the instance fails its EC2 system status check; if the OS hangs or the app crashes, it fails the instance status check or the ALB health check. The ALB marks the target unhealthy after the configured unhealthy threshold and stops sending it requests within seconds, so users only see errors for in-flight requests on that instance. The Auto Scaling group then marks the instance unhealthy, terminates it, and launches a replacement from the launch template in the same or another AZ; boot plus health-check grace period typically means a few minutes at reduced capacity. Any data on the local disk or instance store is lost unless it was on a persisted EBS volume or in S3/RDS.",
    awsMechanisms: [
      "EC2 status checks (system and instance) surfaced as CloudWatch metrics; simplified automatic recovery migrates the instance to healthy hardware after a system check failure while keeping its ID, private IP, and EBS volumes.",
      "Auto Scaling group health checks (EC2 and ELB) automatically terminate unhealthy instances and launch replacements to restore desired capacity.",
      "ALB target group health checks deregister unhealthy targets so traffic is routed only to healthy instances in the other AZ.",
      "EBS volumes persist independently of the instance and can be snapshotted; AMIs let the ASG recreate an identical instance."
    ],
    mitigations: [
      "Always run behind an ASG with min_size >= 2 spread over two AZs, and set health_check_type = ELB so application-level failures trigger replacement.",
      "Keep instances stateless: files in S3, sessions in DynamoDB, data in RDS, so a replacement instance is fully functional at boot.",
      "Tune the ALB health check (path, interval, thresholds) and the ASG grace period so failures are detected quickly but slow boots are not killed prematurely.",
      "Alarm on StatusCheckFailed and UnHealthyHostCount in CloudWatch and notify via SNS; test by terminating an instance in a game day."
    ]
  },
  beginnerConnectionHint: "The load balancer sends web requests to the EC2 instances, the instances talk to RDS, S3, and SQS to do their work, and they report their health and logs to CloudWatch so Auto Scaling can replace any that break."
},
{
  id: "ecs",
  name: "Amazon ECS",
  shortName: "ECS",
  fullName: "Amazon Elastic Container Service",
  category: "compute",
  icon: "📦",
  tagline: "Managed container orchestration; on Fargate you run tasks with no servers to manage",
  whatIsIt: "Amazon ECS runs Docker containers as tasks and keeps long-running services at a desired task count. A task definition describes the container image, CPU/memory, ports, environment, secrets, and IAM roles; a service schedules copies of that task, registers them with a load balancer, and replaces failed ones. With the Fargate launch type AWS provisions the underlying compute per task, so there are no EC2 hosts to patch or scale.",
  eli5: "Imagine your app is packed in a lunchbox with everything it needs inside. ECS is the teacher who makes sure the right number of lunchboxes are always on the table: if one falls on the floor, the teacher puts out a fresh one; if more kids arrive, the teacher puts out more. With Fargate you do not even have to own the table, AWS brings exactly as much table as you need.",
  technical: "ECS is a regional control plane; a cluster is a logical grouping of tasks and services. Task definitions are versioned families that specify containers, resources, taskRoleArn (what the app may call), executionRoleArn (what the ECS agent may do: pull from ECR, write awslogs, read secrets), and log/health configuration. Fargate tasks use awsvpc network mode, so each task receives its own ENI, private IP, and security group in a subnet you choose. Services integrate with Application Auto Scaling for task-count scaling, with ALB/NLB target groups (target type 'ip'), and with deployment circuit breakers for automatic rollback.",
  whyUse: [
    "You want to ship containers without operating an orchestrator control plane or, with Fargate, any hosts at all.",
    "Consistent packaging: the same image runs in CI, staging, and production, pulled from ECR.",
    "Self-healing: the service scheduler restarts tasks that crash or fail health checks and keeps the desired count.",
    "Fine-grained IAM per task (task roles) instead of one shared instance role, plus per-task security groups in awsvpc mode.",
    "Native integration with ALB, Service Auto Scaling, CloudWatch Logs, Secrets Manager, and SQS-driven worker patterns."
  ],
  whenToUse: [
    "Stateless HTTP APIs and web backends behind an ALB, such as the e-commerce API and checkout service.",
    "Background workers that poll SQS and write to RDS, scaled on queue depth.",
    "Long-running processes (WebSocket servers, streaming consumers, schedulers) that exceed Lambda's 15-minute limit or need persistent connections.",
    "Applications that need more memory, longer start-up, or a runtime Lambda does not support well.",
    "Scheduled containerised jobs launched by EventBridge Scheduler as one-off ECS tasks (nightly reports, data exports)."
  ],
  whenNotToUse: [
    "Tiny, spiky, event-driven functions that finish in seconds: Lambda has no idle cost and scales to zero, while a Fargate service always runs at least one task.",
    "GPU workloads, privileged containers, or host-level daemons: Fargate does not support them; use the ECS EC2 launch type or plain EC2.",
    "Teams already standardised on Kubernetes APIs, Helm charts, and operators: Amazon EKS is the closer fit.",
    "Persistent databases in containers: use RDS or DynamoDB rather than a stateful task with a volume.",
    "Serving static assets: S3 with CloudFront is cheaper and needs no running tasks."
  ],
  placement: {
    scope: "vpc",
    subnet: "private-app",
    internetAccessible: false,
    summary: "The ECS control plane is regional and AWS-managed, but each Fargate task's ENI lives inside your VPC in the private app subnets 10.0.11.0/24 and 10.0.12.0/24 across both AZs. The ALB in the public subnets is the only public entry; tasks have private IPs only (assignPublicIp = DISABLED).",
    securityGroup: "Each task gets a security group via awsvpc mode. The API task security group (ecs-sg) allows inbound on the container port (8080) only from the ALB security group; the worker service needs no inbound rules at all because it only polls SQS outbound. RDS's security group then allows 5432 from ecs-sg.",
    nacl: "The private app subnet NACL can allow inbound from the public subnet CIDRs on the container port and ephemeral ports 1024-65535 for return traffic (NACLs are stateless). The default allow-all NACL is common here, with security groups doing the real filtering.",
    routeTable: "The private app route table has 10.0.0.0/16 -> local and 0.0.0.0/0 -> NAT Gateway (one per AZ). Optionally add an S3 gateway endpoint route so ECR image layers and S3 traffic bypass NAT.",
    nat: "Required unless you create VPC endpoints: Fargate tasks in private subnets must reach ECR (ecr.api, ecr.dkr), S3 (image layers), CloudWatch Logs, and Secrets Manager to even start. Either route through the NAT Gateway or, recommended for cost and isolation, add interface endpoints for ECR/Logs/Secrets Manager plus a gateway endpoint for S3.",
    igw: "Not used directly by the tasks. The IGW serves the ALB and NAT Gateway in the public subnets. Only put a task in a public subnet with assignPublicIp = ENABLED for throwaway experiments, never for production."
  },
  dataFlow: {
    in: [
      "HTTP requests from the ALB to the API task's container port after the target passes health checks.",
      "Messages polled from SQS by the worker service (ReceiveMessage over HTTPS; SQS never pushes to ECS).",
      "Container images pulled from ECR and secrets/parameters fetched from Secrets Manager / SSM at task start via the execution role.",
      "Scheduled task launches from EventBridge Scheduler or one-off RunTask calls from CI/CD (e.g. database migrations)."
    ],
    out: [
      "SQL to RDS on 5432, item writes to DynamoDB, object uploads to S3, and messages published to SQS/SNS/EventBridge using the task role.",
      "Container stdout/stderr shipped to CloudWatch Logs by the awslogs driver; Container Insights metrics (CPU, memory per service) to CloudWatch.",
      "Outbound calls to third-party APIs (payments, email) through the NAT Gateway.",
      "Health check responses to the ALB and task state changes to EventBridge (ECS Task State Change events)."
    ]
  },
  networking: [
    "Fargate requires awsvpc network mode: every task consumes one private IP in its subnet, so size subnets for peak task count plus ALB/NAT/endpoint ENIs (a /24 offers 251 usable IPs).",
    "ALB target groups for ECS use target type 'ip'; ECS registers and deregisters task IPs automatically during deployments and scaling.",
    "Tasks in private subnets need NAT or VPC endpoints for com.amazonaws.<region>.ecr.api, ecr.dkr, logs, secretsmanager, and an S3 gateway endpoint; without one of these the task fails with ResourceInitializationError / CannotPullContainerError.",
    "Enable VPC DNS hostnames/resolution and 'Private DNS' on interface endpoints so the default service hostnames resolve to the endpoint IPs.",
    "Service-to-service traffic inside the cluster can use ECS Service Connect or Cloud Map service discovery instead of an internal load balancer."
  ],
  security: {
    iam: "Two roles per task: the task role is assumed by your application code (SDK calls to S3, SQS, DynamoDB); the task execution role is used by the ECS agent to pull from ECR, write to CloudWatch Logs, and read secrets. Operators and CI need ecs:RegisterTaskDefinition, ecs:UpdateService, and iam:PassRole for both roles.",
    securityGroups: "Per-task security groups in awsvpc mode: API tasks accept the container port from the ALB security group only; worker tasks have no inbound rules. RDS and other backends reference ecs-sg rather than CIDRs.",
    nacl: "Optional stateless filtering on the app subnets; if applied, include ephemeral port ranges for return traffic to the ALB and NAT.",
    encryption: "ECR images are encrypted at rest (AES-256 or KMS). TLS from CloudFront/ALB to the client; optionally TLS from ALB to the container. Fargate ephemeral storage is encrypted at rest by AWS. Enforce TLS to RDS from the app.",
    authentication: "The task role provides temporary credentials through the container credential endpoint; no access keys in images or environment variables. Optionally enable ECS Exec (SSM-based) for audited shell access into a running task.",
    authorization: "Task role policies scoped to specific ARNs (one bucket, one queue, one table). Different services (api, worker) get different task roles so a compromised worker cannot read the API's secrets.",
    secrets: "Reference Secrets Manager or SSM SecureString ARNs in the task definition's 'secrets' block; ECS injects them as environment variables at start using the execution role. Never put plain-text secrets in 'environment' or bake them into the image.",
    leastPrivilege: "Separate execution and task roles, scoped policies, private subnets, no public IPs, immutable image tags (or digests) from ECR with image scanning enabled, and read-only root filesystem where the app allows it."
  },
  iam: [
    "Task execution role: the managed policy AmazonECSTaskExecutionRolePolicy (ecr:GetAuthorizationToken, ecr:BatchGetImage, logs:CreateLogStream, logs:PutLogEvents) plus secretsmanager:GetSecretValue / ssm:GetParameters on the referenced secrets and kms:Decrypt if they use a customer key.",
    "API task role: e.g. dynamodb:GetItem/PutItem on the cart table, s3:GetObject on the product-images bucket, sqs:SendMessage on the orders queue.",
    "Worker task role: sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes, sqs:ChangeMessageVisibility on the orders queue; secretsmanager:GetSecretValue for the RDS credential.",
    "Service-linked role AWSServiceRoleForECS lets ECS manage ENIs, register targets with the ALB, and publish metrics; Application Auto Scaling uses its own service-linked role for ECS.",
    "CI/CD principal: ecr:PutImage, ecs:RegisterTaskDefinition, ecs:UpdateService, ecs:DescribeServices, and iam:PassRole restricted to the task and execution role ARNs."
  ],
  scaling: [
    "Service Auto Scaling (Application Auto Scaling) changes the desired task count: target tracking on ECSServiceAverageCPUUtilization, ECSServiceAverageMemoryUtilization, or ALBRequestCountPerTarget for the API service.",
    "The SQS worker scales on queue metrics: a step or target-tracking policy on ApproximateNumberOfMessagesVisible, or better a custom 'backlog per task' metric, so the fleet grows when the queue backs up and shrinks to a minimum when it drains.",
    "Vertical sizing is per task: choose CPU/memory in the task definition (Fargate offers fixed vCPU/memory combinations); redeploying with a bigger size is a rolling update, not downtime.",
    "Deployments use minimumHealthyPercent / maximumPercent to roll new tasks in gradually; the deployment circuit breaker stops and rolls back a release whose tasks keep failing.",
    "Capacity providers let a service mix FARGATE and FARGATE_SPOT (interruptible, discounted) for workers; account-level Fargate task quotas cap the ceiling."
  ],
  availability: [
    "Give the service both private app subnets (10.0.11.0/24 and 10.0.12.0/24); Fargate spreads tasks across the AZs, and the ALB routes only to healthy tasks in either AZ.",
    "Run at least two tasks per production service so a single task or AZ failure does not stop serving traffic.",
    "The service scheduler continuously reconciles running vs desired count, replacing tasks that exit or fail ALB/container health checks.",
    "Deployment circuit breaker with rollback returns to the last healthy task definition automatically when a new release cannot become healthy.",
    "ECR is regional; replicate images to a second Region (ECR cross-Region replication) so a DR cluster can start the same tasks."
  ],
  cost: [
    "Fargate bills per task for vCPU-seconds and GB-seconds from image pull start until task stop; the ECS control plane and clusters are free.",
    "Fargate Spot gives a large discount for interruptible tasks such as workers; ARM (Graviton) tasks are cheaper than x86 for the same size.",
    "NAT Gateway data processing per GB: pulling large images through NAT on every task start adds up; VPC endpoints for ECR/S3 remove most of it.",
    "CloudWatch Logs ingestion and retention for container logs, and Container Insights metrics, are charged separately.",
    "ECR storage per GB-month for images; lifecycle policies expire old tags. The ALB adds hourly plus LCU charges."
  ],
  commonMistakes: [
    "Confusing task role and execution role: giving the app's permissions to the execution role (or vice versa) so pulls fail or the app has no credentials.",
    "Launching tasks in private subnets without NAT or VPC endpoints, then hitting ResourceInitializationError because the image, logs, or secrets cannot be reached.",
    "Using the 'latest' image tag, which makes rollbacks and audits impossible and can pull a different image on each restart.",
    "Putting database passwords in the 'environment' list instead of the 'secrets' list backed by Secrets Manager.",
    "Setting an ALB health check path that needs the database or a slow warm-up, so healthy tasks are killed in a restart loop.",
    "Running a single task with desiredCount = 1 in one subnet and calling it production.",
    "Not setting deploymentCircuitBreaker with rollback, so a bad release leaves the service thrashing at zero healthy tasks."
  ],
  bestPractices: [
    "Fargate in private app subnets across two AZs, assignPublicIp disabled, ALB as the only public entry.",
    "Separate task role and execution role per service; secrets injected from Secrets Manager via the 'secrets' block.",
    "Immutable tags or digests, ECR image scanning on push, and lifecycle policies to prune old images.",
    "Container-level healthCheck plus a lightweight ALB health check endpoint that does not depend on downstream systems.",
    "Deployment circuit breaker with rollback and minimumHealthyPercent 100 / maximumPercent 200 for zero-downtime rolling deploys.",
    "Service Auto Scaling on CPU/request count for the API and on SQS backlog for workers; minimum 2 tasks for the API.",
    "VPC endpoints for ECR, S3, CloudWatch Logs, and Secrets Manager to avoid NAT costs and keep traffic private."
  ],
  creationSteps: [
    "Open the AWS Console and go to Amazon ECR -> Create repository; name it shop-api, enable 'Scan on push' and tag immutability, then push your image with the commands shown under 'View push commands'.",
    "Go to IAM -> Roles and create two roles trusted by 'Elastic Container Service Task': shop-api-execution-role with AmazonECSTaskExecutionRolePolicy plus GetSecretValue on your DB secret, and shop-api-task-role with the app's S3/SQS/DynamoDB permissions.",
    "Go to Amazon ECS -> Clusters -> Create cluster; name it shop-cluster, keep 'AWS Fargate (serverless)' selected, and enable Container Insights.",
    "Go to Task definitions -> Create new task definition; choose Fargate, set CPU 0.5 vCPU and memory 1 GB, and select the task role and execution role created above.",
    "Add a container named api with the ECR image URI (use a version tag, not latest), container port 8080, an 'environment' variable for NODE_ENV, and a 'secrets' entry DB_PASSWORD pointing at the Secrets Manager ARN.",
    "Enable the awslogs log driver (group /ecs/shop-api, prefix api), add a container health check command, and create the task definition.",
    "Go to Clusters -> shop-cluster -> Services -> Create; choose Launch type Fargate, the shop-api task definition, service name shop-api, desired tasks 2, and enable the deployment circuit breaker with rollback.",
    "Under Networking select the shop VPC, the two private app subnets (10.0.11.0/24, 10.0.12.0/24), a security group ecs-sg allowing 8080 from alb-sg, and set Public IP to 'Turned off'.",
    "Under Load balancing select the existing ALB, create or choose a target group (target type IP, port 8080, health check path /health), and set a health check grace period of about 60 seconds.",
    "Under Service auto scaling set minimum 2 / maximum 10 tasks with a target tracking policy on ECSServiceAverageCPUUtilization at 60%, then create the service.",
    "Repeat for the worker: a task definition with the worker image and an sqs-capable task role, a service with no load balancer, no inbound rules in its security group, and scaling based on SQS ApproximateNumberOfMessagesVisible.",
    "Watch the Deployments and Tasks tabs until tasks show RUNNING and the target group reports healthy, then test through the ALB DNS name and check logs in CloudWatch Logs."
  ],
  productionRecommendations: [
    "Fargate tasks in private app subnets across two AZs with no public IPs; ALB in public subnets in front.",
    "Two IAM roles per service (task + execution), both least-privilege; secrets via Secrets Manager 'secrets' block.",
    "Immutable image tags, ECR scanning, and VPC endpoints for ECR/S3/Logs/Secrets Manager.",
    "Deployment circuit breaker with rollback; minimum 2 tasks; Service Auto Scaling on CPU/requests (API) and queue backlog (worker).",
    "awslogs with retention plus Container Insights; alarms on RunningTaskCount, CPU/memory, and ALB 5xx / UnHealthyHostCount.",
    "Worker: set SQS visibility timeout above the maximum processing time and configure a dead-letter queue."
  ],
  configExample: {
    title: "Fargate task definition — roles, awslogs, secret from Secrets Manager",
    lang: "json",
    code: `{
  "family": "shop-api",
  "requiresCompatibilities": ["FARGATE"],
  "networkMode": "awsvpc",
  "cpu": "512",
  "memory": "1024",
  "taskRoleArn": "arn:aws:iam::123456789012:role/shop-api-task-role",
  "executionRoleArn": "arn:aws:iam::123456789012:role/shop-api-execution-role",
  "containerDefinitions": [{
    "name": "api",
    "image": "123456789012.dkr.ecr.eu-west-1.amazonaws.com/shop-api:1.4.2",
    "essential": true,
    "portMappings": [{ "containerPort": 8080, "protocol": "tcp" }],
    "environment": [{ "name": "NODE_ENV", "value": "production" }],
    "secrets": [{
      "name": "DB_PASSWORD",
      "valueFrom": "arn:aws:secretsmanager:eu-west-1:123456789012:secret:shop/db-AbCdEf:password::"
    }],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/shop-api",
        "awslogs-region": "eu-west-1",
        "awslogs-stream-prefix": "api"
      }
    },
    "healthCheck": { "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"], "interval": 30, "timeout": 5, "retries": 3, "startPeriod": 15 }
  }]
}`
  },
  productionChecklist: [
    "Tasks run on Fargate in private app subnets across 2 AZs; assignPublicIp disabled.",
    "Security group allows the container port only from the ALB security group; worker has no inbound rules.",
    "Separate task role and execution role, both least-privilege.",
    "Secrets referenced from Secrets Manager / SSM in the 'secrets' block; none in 'environment'.",
    "Images pulled by immutable tag or digest from ECR with scan-on-push enabled.",
    "VPC endpoints (ECR api/dkr, S3, Logs, Secrets Manager) or NAT Gateway per AZ in place.",
    "awslogs configured with a retention period; Container Insights enabled.",
    "Desired count >= 2 for the API; Service Auto Scaling policies configured for API and worker.",
    "Deployment circuit breaker with rollback enabled; health check grace period set.",
    "CloudWatch alarms on RunningTaskCount, CPU/memory, ALB 5xx, and SQS queue age for the worker."
  ],
  dependencies: [
    { id: "ecr", kind: "required", why: "Stores the container images that task definitions reference." },
    { id: "iam", kind: "required", why: "Task role for the application and execution role for pulling images, logging, and reading secrets." },
    { id: "vpc", kind: "required", why: "Fargate tasks in awsvpc mode get an ENI inside your VPC." },
    { id: "subnets", kind: "required", why: "Private app subnets in two AZs where task ENIs and IPs are allocated." },
    { id: "security-groups", kind: "required", why: "Per-task firewall: container port from the ALB only." },
    { id: "route-tables", kind: "required", why: "Private route table to NAT or VPC endpoints so tasks can pull images and reach AWS APIs." },
    { id: "nat-gateway", kind: "recommended", why: "Outbound access from private subnets for ECR pulls and third-party APIs (VPC endpoints are the alternative for AWS services)." },
    { id: "alb", kind: "recommended", why: "Public entry point for the API service; health checks and target registration are automatic." },
    { id: "auto-scaling", kind: "recommended", why: "Service Auto Scaling adjusts task counts on CPU, requests, or SQS backlog." },
    { id: "cloudwatch", kind: "recommended", why: "Container logs via awslogs, Container Insights metrics, and alarms." },
    { id: "sqs", kind: "optional", why: "The worker service polls SQS to process orders asynchronously." },
    { id: "eventbridge", kind: "optional", why: "Scheduler can launch one-off ECS tasks and receives task state-change events." },
    { id: "ec2", kind: "alternative", why: "ECS EC2 launch type or plain instances when Fargate cannot run the workload (GPU, privileged)." },
    { id: "lambda", kind: "alternative", why: "Event-driven functions without always-on tasks for spiky or short work." }
  ],
  related: ["ec2", "lambda", "ecr", "alb", "auto-scaling", "sqs", "security-groups", "iam"],
  ecommerceRole: "Primary compute for the platform: the shop-api service runs on Fargate behind the ALB in the private app subnets and talks to RDS, DynamoDB, and S3, while the shop-worker service consumes the orders SQS queue and writes to RDS. Both pull images from ECR and log to CloudWatch.",
  failure: {
    title: "ECS task fails",
    whatHappens: "When the essential container exits or its health check fails, ECS stops the task and records a stoppedReason. The service scheduler notices running count < desired count and launches a replacement task from the same task definition, usually in the other private subnet/AZ if that one is healthy. Meanwhile the ALB's health checks mark the task's IP unhealthy and stop routing to it, so only requests in flight on that task see errors while the remaining tasks keep serving. For the SQS worker, any message the failed task had received but not deleted becomes visible again after the visibility timeout and is picked up by another task; after maxReceiveCount failures it lands in the dead-letter queue. If every new task also fails during a deployment, the deployment circuit breaker rolls the service back to the last healthy task definition.",
    awsMechanisms: [
      "ECS service scheduler keeps running tasks equal to desired count, replacing stopped or unhealthy tasks automatically.",
      "ALB target group health checks deregister unhealthy task IPs and route only to healthy tasks in either AZ; ECS treats ALB-unhealthy tasks as failed.",
      "Container-level healthCheck in the task definition and the deployment circuit breaker with automatic rollback for failed releases.",
      "SQS visibility timeout and dead-letter queue redelivery for the worker pattern; ECS Task State Change events in EventBridge for alerting."
    ],
    mitigations: [
      "Run desiredCount >= 2 across both AZs and keep the API stateless so any task can serve any request.",
      "Make the health check endpoint cheap and independent of downstream systems; set a realistic health check grace period so slow starts are not killed.",
      "Enable the deployment circuit breaker with rollback and alarm on RunningTaskCount and ALB UnHealthyHostCount / 5xx in CloudWatch.",
      "For workers, make message handling idempotent, set the SQS visibility timeout above the processing time, and attach a DLQ with an alarm on its depth."
    ]
  },
  beginnerConnectionHint: "The load balancer hands web requests to the ECS API tasks, a second group of ECS worker tasks picks jobs off the SQS queue, both fetch their images from ECR and talk to RDS, DynamoDB, and S3, and everything they print goes to CloudWatch."
},
{
  id: "lambda",
  name: "AWS Lambda",
  shortName: "Lambda",
  fullName: "AWS Lambda",
  category: "compute",
  icon: "λ",
  tagline: "Run code in response to events without servers; pay per request and per millisecond",
  whatIsIt: "AWS Lambda runs your function code in response to events (HTTP requests via API Gateway, EventBridge rules, SQS messages, S3 uploads) without you provisioning servers. You upload code or a container image, choose memory and timeout, and Lambda handles provisioning, scaling each invocation in its own isolated execution environment, and billing only for the time your code runs.",
  eli5: "Lambda is like a helper who only appears when the doorbell rings. You write down what the helper should do, and every time someone rings the bell the helper pops up, does that one job, and disappears again. If a hundred people ring at once, a hundred helpers appear. You only pay for the seconds they were actually working.",
  technical: "Lambda is a regional service that executes functions in Firecracker micro-VM execution environments managed by AWS, outside your VPC by default. Invocations are synchronous (API Gateway, ALB, direct Invoke), asynchronous (EventBridge, S3, SNS: Lambda queues the event and retries twice on failure), or poll-based through event source mappings (SQS, DynamoDB Streams, Kinesis). Each function has an execution role (IAM) for outbound calls, a resource-based policy that lets event sources invoke it, configurable memory (128 MB to 10,240 MB, CPU scales with it), and a maximum timeout of 15 minutes. Optionally a function attaches to VPC subnets via Hyperplane ENIs so it can reach private resources such as RDS.",
  whyUse: [
    "Zero idle cost: functions scale to zero between invocations and scale out automatically under load.",
    "No servers, AMIs, or task definitions to maintain; AWS patches the runtime and underlying hosts.",
    "Native event integration with API Gateway, EventBridge, SQS, S3, DynamoDB Streams, and SNS with retries built in.",
    "Per-function IAM roles and independent deployment of small units of code.",
    "Fast iteration for glue code, webhooks, scheduled jobs, and data transformations."
  ],
  whenToUse: [
    "A serverless HTTP API behind API Gateway (e.g. product search or a promotions endpoint) as an alternative entry path to the ALB -> ECS API.",
    "Reacting to EventBridge events such as 'OrderPlaced' to update a DynamoDB projection, send notifications, or start a Step Functions workflow.",
    "Processing S3 uploads (resize product images, validate CSV imports) or DynamoDB Streams / SQS messages in small batches.",
    "Scheduled jobs with EventBridge Scheduler (nightly cleanup, inventory sync) that run for seconds to a few minutes.",
    "Spiky or unpredictable traffic where paying for always-on tasks would be wasteful."
  ],
  whenNotToUse: [
    "Work that runs longer than 15 minutes or needs persistent connections (WebSockets to your process, long polling): run it as an ECS service instead.",
    "Steady, high, predictable request volume where always-on containers on ECS Fargate are cheaper and have no cold starts.",
    "Heavy relational database connection churn from thousands of concurrent invocations: use RDS Proxy or move the workload to ECS.",
    "Multi-step business workflows with waits and branching coded inside one function: orchestrate with Step Functions and keep functions small.",
    "Workloads that need GPUs, more than 10 GB of memory, or full OS control: use EC2."
  ],
  placement: {
    scope: "regional",
    subnet: "any",
    internetAccessible: false,
    summary: "Lambda runs in an AWS-managed environment outside your VPC by default, reached only through invocations (API Gateway, EventBridge, SQS) and calling public AWS endpoints (DynamoDB, S3) directly. In the reference architecture the API Gateway -> Lambda -> DynamoDB path needs no VPC at all; only a function that must reach RDS is optionally attached to the private app subnets.",
    securityGroup: "Not applicable by default: a non-VPC function has no ENI in your VPC and cannot be given a security group. When VPC-attached, the function gets a security group on its ENIs (e.g. lambda-sg) which the RDS security group then allows on 5432; inbound rules are irrelevant because nothing connects into a Lambda ENI.",
    nacl: "Not applicable by default. For a VPC-attached function, the NACL of the chosen subnets applies to its ENI traffic; allow outbound to RDS/NAT and the ephemeral return ports (NACLs are stateless).",
    routeTable: "Not applicable by default. A VPC-attached function uses the route table of its subnets: choose the private app subnets whose 0.0.0.0/0 goes to the NAT Gateway; never put a function in a public subnet expecting internet access, since Lambda ENIs never receive public IPs.",
    nat: "Not required by default because the function is outside the VPC and calls AWS APIs over the public network. Required as soon as the function is VPC-attached and needs the internet or AWS APIs: use the NAT Gateway in the public subnets, or (recommended) gateway endpoints for S3/DynamoDB and interface endpoints for other services.",
    igw: "Not used. A VPC-attached Lambda never has a public IP, so an IGW route does nothing for it; outbound internet from a VPC function always goes via NAT.",
    vpcOptional: "Optional: configure VpcConfig with the private app subnets (10.0.11.0/24, 10.0.12.0/24) and a security group only when the function must reach private resources such as RDS or an internal ALB. Lambda then creates Hyperplane ENIs in those subnets (the role needs AWSLambdaVPCAccessExecutionRole), the function loses direct internet access and must use NAT or VPC endpoints for S3, DynamoDB, Secrets Manager, and third-party APIs, and it consumes subnet IPs. Functions that only use DynamoDB, S3, SQS, or EventBridge should stay outside the VPC."
  },
  dataFlow: {
    in: [
      "HTTP requests proxied by API Gateway (REST or HTTP API) as JSON events, synchronously; the client waits for the response.",
      "Events from EventBridge rules (e.g. OrderPlaced) delivered asynchronously; S3 and SNS notifications work the same way.",
      "Batches of messages pulled from SQS or records from DynamoDB Streams by Lambda's event source mapping poller.",
      "Configuration from environment variables and secrets fetched at cold start from Secrets Manager / SSM Parameter Store."
    ],
    out: [
      "Item writes and reads to DynamoDB (PutItem, UpdateItem, Query) and object operations on S3 using the execution role.",
      "Events published to EventBridge, messages to SQS/SNS, or Step Functions executions started for longer workflows.",
      "Synchronous responses back to API Gateway (status, headers, body) and failed async events to an on-failure destination or DLQ.",
      "Logs to CloudWatch Logs (one log group per function) and metrics (Invocations, Errors, Duration, Throttles, ConcurrentExecutions) to CloudWatch."
    ]
  },
  networking: [
    "By default there is no VPC networking to configure: Lambda reaches DynamoDB, S3, and other AWS APIs over AWS's network and the public endpoints, and is invoked only through the Lambda API.",
    "API Gateway invokes the function through the Lambda service API using a resource-based policy; no ports, security groups, or listeners are involved. API Gateway's integration timeout (about 29 seconds by default) is shorter than Lambda's maximum, so keep synchronous functions fast.",
    "VPC-attached functions get ENIs in the subnets you list; provide subnets in both AZs and make sure each subnet has spare IPs and a route to NAT or the needed VPC endpoints.",
    "Access RDS from a VPC-attached function through RDS Proxy to pool connections; the Lambda security group must be allowed by the RDS (or proxy) security group on 5432/3306.",
    "Lambda Function URLs and ALB target groups are alternative ways to expose a function over HTTPS if you do not need API Gateway features."
  ],
  security: {
    iam: "Every function has an execution role that its code assumes; grant only the actions it needs (e.g. dynamodb:PutItem on one table). Invokers (API Gateway, EventBridge, S3) are granted lambda:InvokeFunction through the function's resource-based policy.",
    securityGroups: "Not applicable unless VPC-attached; then a dedicated security group with no inbound rules and outbound to RDS/NAT/endpoints, referenced by the RDS security group.",
    nacl: "Not applicable unless VPC-attached; then the subnet NACL must allow outbound traffic and ephemeral return ports.",
    encryption: "Environment variables are encrypted at rest with KMS (optionally a customer managed key and client-side encryption helpers). Code and container images are encrypted at rest; all invocations and AWS API calls use TLS.",
    authentication: "The execution role supplies temporary credentials to the runtime; no access keys in code. Callers are authenticated by API Gateway (IAM, Cognito, JWT authorizer, or Lambda authorizer) before the function is invoked.",
    authorization: "API Gateway authorizers decide who may call which route; inside the function, the execution role limits what AWS resources can be touched. Use a separate role per function rather than one shared role.",
    secrets: "Read secrets from Secrets Manager or SSM Parameter Store at initialisation and cache them across warm invocations (or use the Parameters and Secrets Lambda Extension); never commit them into code or plain environment variables in source control.",
    leastPrivilege: "One role per function, resource ARNs not wildcards, resource-based policy restricted to the specific API Gateway or EventBridge rule ARN as source, reserved concurrency to limit blast radius, and VPC attachment only when a private resource requires it."
  },
  iam: [
    "Execution role trust policy for lambda.amazonaws.com with AWSLambdaBasicExecutionRole (logs:CreateLogGroup, logs:CreateLogStream, logs:PutLogEvents) plus scoped application permissions such as dynamodb:PutItem/GetItem on the orders table ARN.",
    "VPC-attached functions additionally need AWSLambdaVPCAccessExecutionRole (ec2:CreateNetworkInterface, ec2:DescribeNetworkInterfaces, ec2:DeleteNetworkInterface) so Lambda can manage its ENIs.",
    "SQS-triggered functions need sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes on the queue in the execution role; the poller runs as the function's role.",
    "Resource-based policy statements granting lambda:InvokeFunction to apigateway.amazonaws.com (with the API's execute-api ARN as SourceArn) and to events.amazonaws.com for the EventBridge rule.",
    "Deployers need lambda:CreateFunction, lambda:UpdateFunctionCode, lambda:UpdateFunctionConfiguration, lambda:PublishVersion, and iam:PassRole limited to the function's execution role."
  ],
  scaling: [
    "Lambda scales by running more concurrent execution environments; concurrency roughly equals request rate multiplied by average duration. Scale-out is fast but rate-limited per function, and requests beyond available concurrency are throttled (429 / Throttles metric).",
    "The account has a Regional concurrency quota (1,000 by default, raisable) shared by all functions; reserved concurrency carves out a guaranteed slice for a critical function and also caps it to protect downstream systems such as RDS.",
    "Provisioned concurrency keeps a set number of environments initialised to eliminate cold starts for latency-sensitive API routes; it can be scheduled or target-tracked with Application Auto Scaling.",
    "For SQS event sources, Lambda's pollers scale the number of concurrent batches up based on queue depth; batch size, batching window, and the event source's maximum concurrency setting control throughput.",
    "Vertical: raising memory also raises CPU share and network, often reducing duration enough to lower cost; tools like Lambda Power Tuning find the best size."
  ],
  availability: [
    "Lambda is a Regional service that runs functions across multiple AZs automatically; a single AZ failure does not stop non-VPC functions.",
    "For VPC-attached functions, list subnets in at least two AZs so Lambda can place ENIs in a healthy AZ.",
    "Asynchronous invocations are queued by Lambda and retried twice on function error; configure maximum event age and retry attempts and send failures to an on-failure destination (SQS, SNS, EventBridge, Lambda) or a dead-letter queue.",
    "Versions and aliases with weighted routing enable canary or linear deployments and instant rollback by repointing the alias.",
    "For Regional DR, deploy the same function (infrastructure as code) in a second Region with DynamoDB global tables; Route 53 or API Gateway custom domains can shift traffic."
  ],
  cost: [
    "Requests: a flat price per million invocations, with a monthly free tier of 1 million requests and 400,000 GB-seconds.",
    "Duration: billed per millisecond as GB-seconds (memory allocated multiplied by run time); ARM (Graviton) functions cost less per GB-second than x86.",
    "Provisioned concurrency is billed for the time it is configured even when idle, plus reduced duration pricing when used.",
    "Ephemeral storage above the default 512 MB, data transfer out, and, for VPC functions, NAT Gateway data-processing charges for outbound traffic.",
    "Surrounding services add up: API Gateway per request, CloudWatch Logs ingestion (verbose logging is a common hidden cost), and DynamoDB capacity."
  ],
  commonMistakes: [
    "Attaching every function to the VPC 'for security' and then discovering it cannot reach DynamoDB, S3, or the internet without NAT or VPC endpoints.",
    "Opening a new database connection on every invocation to RDS and exhausting max_connections; use RDS Proxy and initialise clients outside the handler.",
    "Assuming an event is processed exactly once: async retries and SQS redelivery mean handlers must be idempotent (e.g. conditional writes in DynamoDB).",
    "Setting the SQS visibility timeout shorter than the function timeout, so messages are redelivered while still being processed; AWS recommends at least six times the function timeout.",
    "Deploying to the unqualified $LATEST version from CI with no alias, so there is no canary and no instant rollback.",
    "Logging entire request payloads (including PII and tokens) at INFO level and paying for it in CloudWatch Logs.",
    "Creating recursive loops (S3 event -> Lambda -> writes to same bucket -> event) that burn money until recursion detection or a manual stop kicks in."
  ],
  bestPractices: [
    "One small function per responsibility with its own least-privilege execution role and its own log group retention.",
    "Initialise SDK clients and secrets outside the handler to reuse them across warm invocations; keep the handler idempotent.",
    "Stay outside the VPC unless a private resource requires it; when attached, use two private subnets, RDS Proxy, and VPC endpoints.",
    "Set timeouts and memory deliberately (not the defaults) and tune memory for cost/performance.",
    "Configure on-failure destinations or a DLQ for async invocations and a DLQ with maxReceiveCount on SQS sources; alarm on Errors, Throttles, DLQ depth, and IteratorAge.",
    "Publish versions and deploy via aliases with weighted or canary traffic shifting; keep reserved concurrency on functions that talk to fragile downstreams.",
    "Structured JSON logging plus X-Ray or Lambda Powertools for tracing across API Gateway, Lambda, and DynamoDB."
  ],
  creationSteps: [
    "Open the AWS Console and go to IAM -> Roles -> Create role; choose 'Lambda' as the trusted service, attach AWSLambdaBasicExecutionRole and a custom policy allowing dynamodb:PutItem/GetItem on the orders table ARN, and name it shop-orders-fn-role.",
    "Go to AWS Lambda -> Functions -> Create function; choose 'Author from scratch', name it shop-orders-api, select a runtime such as Node.js 20.x and the arm64 architecture.",
    "Under 'Change default execution role' choose 'Use an existing role' and select shop-orders-fn-role, then click Create function.",
    "In the Code tab upload your deployment package (zip) or paste the handler, and set the handler name (e.g. index.handler); click Deploy.",
    "In Configuration -> General configuration set memory (e.g. 512 MB) and timeout (e.g. 10 seconds for an API function).",
    "In Configuration -> Environment variables add TABLE_NAME with the DynamoDB table name; leave secrets out and read them from Secrets Manager in code if needed.",
    "Skip Configuration -> VPC unless the function must reach RDS; if it must, choose the shop VPC, the two private app subnets (10.0.11.0/24, 10.0.12.0/24), a security group lambda-sg, and add AWSLambdaVPCAccessExecutionRole to the role.",
    "Add a trigger: choose API Gateway, create a new HTTP API with a route such as POST /orders and set security (JWT authorizer or IAM) so the function is not open to anonymous callers.",
    "Add a second trigger: EventBridge, create a rule matching detail-type 'OrderPlaced' on your event bus; Lambda adds the invoke permission automatically.",
    "In Configuration -> Asynchronous invocation set maximum age and retry attempts, and add an on-failure destination (an SQS queue named shop-orders-dlq).",
    "Test with the Test tab using a sample API Gateway event, then check CloudWatch Logs and the Monitor tab for Errors and Duration.",
    "Publish a version, create an alias 'live' pointing at it, and point the API Gateway integration at the alias ARN so future deploys can shift traffic gradually."
  ],
  productionRecommendations: [
    "Dedicated least-privilege execution role per function; resource-based policy limited to the specific API/rule ARN.",
    "Outside the VPC unless RDS or another private resource is required; then two private subnets, RDS Proxy, and VPC endpoints or NAT.",
    "Explicit memory and timeout, reserved concurrency for functions calling fragile downstreams, provisioned concurrency for latency-critical routes.",
    "On-failure destination or DLQ for async triggers; SQS DLQ with maxReceiveCount and visibility timeout >= 6x function timeout.",
    "Versions plus aliases with canary deployments; CloudWatch alarms on Errors, Throttles, Duration p99, and DLQ depth.",
    "Structured logs with a retention policy and X-Ray tracing enabled end to end."
  ],
  configExample: {
    title: "Terraform — Lambda with execution role, DynamoDB access, optional VPC config commented",
    lang: "hcl",
    code: `resource "aws_iam_role" "orders_fn" {
  name = "shop-orders-fn-role"
  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "lambda.amazonaws.com" } }]
  })
}

resource "aws_iam_role_policy_attachment" "logs" {
  role       = aws_iam_role.orders_fn.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}   # plus an inline policy: dynamodb:PutItem / GetItem on aws_dynamodb_table.orders.arn only

resource "aws_lambda_function" "orders" {
  function_name = "shop-orders-api"
  role          = aws_iam_role.orders_fn.arn
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  filename      = "build/orders.zip"
  memory_size   = 512
  timeout       = 10
  environment { variables = { TABLE_NAME = aws_dynamodb_table.orders.name } }

  # OPTIONAL: attach to the VPC only if the function must reach private resources (e.g. RDS). It then loses
  # direct internet access (needs NAT or VPC endpoints) and the role needs AWSLambdaVPCAccessExecutionRole for ENIs.
  # vpc_config {
  #   subnet_ids         = [aws_subnet.app_a.id, aws_subnet.app_b.id]  # 10.0.11.0/24, 10.0.12.0/24
  #   security_group_ids = [aws_security_group.lambda.id]              # allowed by rds-sg on 5432
  # }
}`
  },
  productionChecklist: [
    "Dedicated execution role with least-privilege resource ARNs; no wildcard actions.",
    "Resource-based policy limits invokers to the specific API Gateway stage / EventBridge rule ARN.",
    "Memory and timeout set explicitly; API-facing functions finish well under the API Gateway integration timeout.",
    "VPC attachment only where required; if attached, two private subnets, lambda-sg allowed by rds-sg, NAT or VPC endpoints present.",
    "Handler is idempotent; SDK clients initialised outside the handler.",
    "Async triggers have an on-failure destination or DLQ; SQS sources have a DLQ and visibility timeout >= 6x function timeout.",
    "Versions published and traffic served through an alias with canary or linear deployments.",
    "Reserved concurrency set for functions that call RDS or third-party APIs; provisioned concurrency for latency-critical routes.",
    "CloudWatch alarms on Errors, Throttles, Duration, and DLQ depth; log group retention configured.",
    "Secrets read from Secrets Manager / SSM, not stored in plain environment variables or code."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Execution role for the function's AWS calls and resource-based policy for its invokers." },
    { id: "cloudwatch", kind: "required", why: "Logs, metrics (Errors, Throttles, Duration), and alarms; the execution role must be able to write logs." },
    { id: "api-gateway", kind: "recommended", why: "HTTPS front door for synchronous invocations; alternative entry path to the ALB -> ECS API." },
    { id: "eventbridge", kind: "recommended", why: "Triggers functions asynchronously from domain events and schedules." },
    { id: "dynamodb", kind: "recommended", why: "Natural low-latency data store for Lambda-backed APIs and event projections." },
    { id: "sqs", kind: "optional", why: "Event source for batch processing and the usual on-failure destination / DLQ." },
    { id: "step-functions", kind: "optional", why: "Orchestrates multi-step workflows that chain several functions with retries and waits." },
    { id: "vpc", kind: "optional", why: "Only needed when the function must reach private resources such as RDS." },
    { id: "subnets", kind: "optional", why: "Private app subnets in two AZs for the function's ENIs when VPC-attached." },
    { id: "security-groups", kind: "optional", why: "Security group on the function's ENIs when VPC-attached; referenced by the RDS security group." },
    { id: "nat-gateway", kind: "optional", why: "Internet and AWS API access for a VPC-attached function (VPC endpoints are the alternative)." },
    { id: "ecs", kind: "alternative", why: "Always-on containers for long-running, steady, or connection-heavy workloads." },
    { id: "ec2", kind: "alternative", why: "Full OS control, GPUs, or memory above Lambda's limits." }
  ],
  related: ["ecs", "ec2", "api-gateway", "eventbridge", "step-functions", "dynamodb", "sqs", "iam"],
  ecommerceRole: "Serverless side of the platform: API Gateway -> Lambda serves lightweight endpoints as an alternative to the ALB -> ECS path, and EventBridge -> Lambda (or Step Functions) reacts to OrderPlaced events by writing projections and notifications to DynamoDB. These functions stay outside the VPC; only a function that needs RDS would be attached to the private app subnets.",
  failure: {
    title: "Lambda fails (invocation errors or throttling)",
    whatHappens: "For a synchronous call from API Gateway, a function error or timeout is returned immediately to the client as a 5xx; nothing is retried by Lambda, so the client or API Gateway must handle it. For asynchronous invocations from EventBridge or S3, Lambda queues the event and retries it twice with a delay; if it still fails (or the event exceeds the maximum age) the event is sent to the on-failure destination or dead-letter queue if configured, otherwise it is dropped. For SQS event sources, a failed batch is not deleted, so the messages become visible again after the visibility timeout and are retried until maxReceiveCount moves them to the queue's DLQ. Throttling (concurrency exhausted) returns 429 to synchronous callers, is retried for async events for up to six hours, and simply slows down SQS polling. The Lambda service itself is multi-AZ, so infrastructure failures rarely surface; most incidents are code errors, timeouts, bad IAM, or downstream (RDS/DynamoDB) limits.",
    awsMechanisms: [
      "Asynchronous invocation queue with automatic retries (two by default), configurable maximum event age and retry attempts, and on-failure / on-success destinations (SQS, SNS, EventBridge, Lambda) or a dead-letter queue.",
      "SQS event source mapping: visibility timeout redelivery, partial batch responses (ReportBatchItemFailures), and the queue's dead-letter queue after maxReceiveCount.",
      "Concurrency controls: account and reserved concurrency limits produce Throttles rather than overloading downstreams; provisioned concurrency avoids cold-start latency spikes.",
      "EventBridge has its own delivery retry policy and DLQ for targets it cannot invoke; CloudWatch metrics Errors, Throttles, DeadLetterErrors, and IteratorAge plus alarms surface problems."
    ],
    mitigations: [
      "Make handlers idempotent so retries and SQS redelivery never double-charge or duplicate orders (DynamoDB conditional writes, idempotency keys).",
      "Configure an on-failure destination for every async trigger and a DLQ for every SQS source; alarm on their depth and replay after fixing the bug.",
      "Set reserved concurrency for functions that hit RDS or third-party APIs, use RDS Proxy, and add retries with backoff in API clients so 429s are absorbed.",
      "Deploy through aliases with canary traffic shifting and automatic rollback on Errors alarms; keep timeouts realistic and monitor Duration p99."
    ]
  },
  beginnerConnectionHint: "API Gateway or EventBridge wakes a Lambda function up, the function reads or writes DynamoDB (or S3 and SQS) using its own permission role, and it drops its logs and error counts into CloudWatch before going back to sleep."
});
