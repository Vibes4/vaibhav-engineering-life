/* Identity & access services — ECR, IAM, Security Groups, Application Authorization, Network ACLs (schema: _schema.md) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "ecr",
  name: "Amazon ECR",
  shortName: "ECR",
  fullName: "Amazon Elastic Container Registry",
  category: "containers",
  icon: "🗃️",
  tagline: "Private, managed Docker/OCI image registry that ECS, Fargate, EKS, and Lambda pull from",
  whatIsIt: "Amazon ECR is a fully managed container image registry. You push Docker/OCI images to a repository in your account and Region, and container runtimes such as ECS on Fargate pull them at task start. ECR handles storage, encryption, access control via IAM, vulnerability scanning, and lifecycle cleanup of old images.",
  eli5: "ECR is like a shelf of labelled lunchboxes in the school kitchen. Every time a new helper (a container) starts work, it grabs the lunchbox with the right label so it has exactly the same food as everyone else. The kitchen checks the lunchboxes for anything bad, and throws away the really old ones so the shelf never overflows.",
  technical: "ECR is a regional service outside your VPC that exposes two endpoints: the ECR API (repository management, GetAuthorizationToken) and the Docker registry endpoint (<account>.dkr.ecr.<region>.amazonaws.com) implementing the OCI Distribution API over HTTPS. Image manifests are stored by ECR while image layers are stored in Amazon S3, so a pull needs reachability to ECR and to S3. Authentication uses a 12-hour token obtained through IAM (SigV4) and passed to the Docker client; authorization is IAM identity policies plus optional repository policies.",
  whyUse: [
    "Container images need to live somewhere ECS/Fargate can pull them quickly, privately, and with IAM-controlled access — a public Docker Hub account is neither private nor rate-limit-free.",
    "Same-Region pulls are fast and avoid Docker Hub rate limits and third-party outages that would block deployments.",
    "Image scanning (basic or enhanced via Amazon Inspector) finds known CVEs in OS packages before an image reaches production.",
    "Lifecycle policies automatically expire old or untagged images so storage costs do not grow forever.",
    "Immutable tags stop someone from silently re-pushing a different image under the tag 'v1.2.3' that production already runs."
  ],
  whenToUse: [
    "Every ECS/Fargate service in the reference architecture (web/API tasks and the SQS worker) pulls its image from ECR.",
    "Lambda functions packaged as container images (up to 10 GB) must be stored in ECR in the same account and Region.",
    "CI/CD pipelines that build an image per commit and deploy by updating the task definition's image URI.",
    "Sharing a base image across accounts or Regions with cross-account repository policies and cross-Region replication."
  ],
  whenNotToUse: [
    "Public open-source images you want the whole world to pull anonymously: use Amazon ECR Public or Docker Hub instead of a private repository.",
    "Storing arbitrary build artifacts, zip files, or static assets: put those in S3; ECR expects OCI images/artifacts.",
    "Very large binary blobs your application downloads at runtime: use S3 with presigned URLs, not image layers.",
    "Source code or Helm-like configuration you edit often: keep it in a git repository; ECR is for built, immutable images (although OCI artifacts such as Helm charts are supported)."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: true,
    summary: "ECR is an AWS-managed regional service that lives outside your VPC. Fargate tasks in the private app subnets reach it either over the internet path (NAT Gateway → IGW → public ECR endpoint) or privately through interface VPC endpoints (ecr.api and ecr.dkr) plus the S3 gateway endpoint for the image layers.",
    securityGroup: "Not applicable to ECR itself — it has no ENI in your VPC. If you create interface VPC endpoints for ecr.api/ecr.dkr, each endpoint ENI gets a security group that must allow inbound 443 from the ECS task security group.",
    nacl: "The private app subnet NACL must allow outbound 443 (to NAT or to the endpoint ENIs) and inbound ephemeral ports 1024–65535 for the responses; the default allow-all NACL already covers this.",
    routeTable: "Via internet: the private app route table needs 0.0.0.0/0 → NAT Gateway. Via endpoints: the S3 gateway endpoint adds a prefix-list route to the private route table automatically; interface endpoints need no route (they use private DNS in the VPC).",
    nat: "Required if you do not create VPC endpoints — Fargate tasks in private subnets have no public IP and must go through the NAT Gateway to reach the public ECR and S3 endpoints. Optional (not needed) once ecr.api, ecr.dkr and S3 endpoints exist.",
    igw: "Not required by ECR directly. The IGW is only involved indirectly when pulls traverse the NAT Gateway in the public subnet.",
    vpcOptional: "Optional but recommended: interface endpoints for com.amazonaws.<region>.ecr.api and com.amazonaws.<region>.ecr.dkr (with private DNS enabled) plus a gateway endpoint for S3 keep image pulls inside the AWS network and cut NAT data-processing charges. Fargate tasks with awslogs also need a logs interface endpoint to work fully without NAT."
  },
  dataFlow: {
    in: [
      "docker push / buildx push of image manifests and layers from CI/CD runners or developer machines over HTTPS 443.",
      "GetAuthorizationToken and repository API calls (create repository, put lifecycle policy, start scan) signed with SigV4.",
      "Replication traffic from a source Region/account when cross-Region or cross-account replication is configured."
    ],
    out: [
      "Image manifests and layers pulled by ECS/Fargate tasks, EKS nodes, Lambda, or developers (layers served from S3).",
      "Scan findings (CVE list per image) to the ECR console/API, EventBridge events, and optionally Amazon Inspector.",
      "EventBridge events for image push, scan completion, and replication that can trigger deployment pipelines.",
      "API audit trail to CloudTrail; repository storage metrics to CloudWatch."
    ]
  },
  networking: [
    "All traffic is HTTPS on TCP 443 — to the ECR API endpoint, the .dkr registry endpoint, and to S3 for layer blobs.",
    "Private subnets need either 0.0.0.0/0 → NAT Gateway or interface endpoints (ecr.api, ecr.dkr) plus an S3 gateway endpoint.",
    "Enable 'Private DNS' on the interface endpoints so the standard ECR hostnames resolve to the endpoint ENIs without changing the image URI.",
    "The endpoint security group must allow inbound 443 from the ECS task security group (or the app subnet CIDRs).",
    "Fargate platform version 1.4.0+ pulls layers from S3 directly, which is why the S3 gateway endpoint is required for a fully private pull path."
  ],
  security: {
    iam: "IAM identity policies control who may push (ecr:PutImage, ecr:InitiateLayerUpload…), pull (ecr:BatchGetImage, ecr:GetDownloadUrlForLayer, ecr:BatchCheckLayerAvailability) and administer repositories. ecr:GetAuthorizationToken must be granted on resource '*'.",
    securityGroups: "Not applicable to the service itself; applies only to the ENIs of interface VPC endpoints, which should accept 443 solely from the ECS task security group.",
    nacl: "Standard outbound 443 and inbound ephemeral 1024–65535 on the app subnet NACL; nothing ECR-specific.",
    encryption: "Images are encrypted at rest with AES-256 by default (SSE-S3 style) or with a customer managed KMS key chosen at repository creation. All transfers use TLS.",
    authentication: "Docker clients authenticate with a temporary token from 'aws ecr get-login-password' (valid 12 hours); ECS agents and Fargate authenticate automatically using the task execution role.",
    authorization: "Two layers: the caller's IAM policy and an optional repository policy (resource-based) used for cross-account pulls. Both must allow the action for it to succeed across accounts.",
    secrets: "No secrets belong in images — never bake API keys or database passwords into layers; inject them at runtime from Secrets Manager or SSM Parameter Store via the task definition.",
    leastPrivilege: "The ECS task execution role needs pull permissions only (the AWS managed AmazonECSTaskExecutionRolePolicy covers this); CI/CD gets push scoped to specific repository ARNs; developers get read-only unless they deploy."
  },
  iam: [
    "ECS task execution role: ecr:GetAuthorizationToken (resource *), ecr:BatchCheckLayerAvailability, ecr:GetDownloadUrlForLayer, ecr:BatchGetImage on the repository ARNs — this is what lets Fargate pull the image.",
    "CI/CD pipeline role: the pull actions above plus ecr:PutImage, ecr:InitiateLayerUpload, ecr:UploadLayerPart, ecr:CompleteLayerUpload on the specific repository ARN.",
    "Repository administrators: ecr:CreateRepository, ecr:PutLifecyclePolicy, ecr:PutImageScanningConfiguration, ecr:SetRepositoryPolicy, ecr:DeleteRepository — scoped by ARN or tags.",
    "Cross-account pulls need a repository policy granting the other account's principal the pull actions in addition to that principal's own identity policy.",
    "If the repository uses a customer managed KMS key, the key policy must allow the ECR service principal and the pulling/pushing roles to use the key."
  ],
  scaling: [
    "ECR is a managed, multi-tenant service; you do not provision capacity — push and pull throughput scale automatically within per-account API rate quotas.",
    "Image layers are stored in S3, so pulls of the same layers by many Fargate tasks scale horizontally without a single origin bottleneck.",
    "Pull-through cache rules let you cache upstream public registries (for example Docker Hub or ECR Public) in your private ECR so many tasks do not hit external rate limits.",
    "Cross-Region replication copies images to other Regions so tasks pull locally instead of across Regions.",
    "Keep images small (multi-stage builds, slim base images) — image size is the biggest factor in Fargate task start-up time during a scale-out."
  ],
  availability: [
    "ECR is a regional service replicated across multiple Availability Zones within the Region; you do not manage its redundancy.",
    "Image layers inherit S3's durability design.",
    "Cross-Region replication (configured at the registry level) provides a copy of images in a second Region for DR or multi-Region deployments.",
    "Running tasks are not affected by an ECR outage — only new task launches (deployments, scale-out, replacement of failed tasks) need to pull.",
    "Pull-through cache and replication reduce dependence on external registries during their outages."
  ],
  cost: [
    "Storage per GB-month of images in private repositories — this grows silently unless lifecycle policies delete old images.",
    "Data transfer out to the internet (for example pulls from outside AWS); pulls within the same Region from ECS/Fargate do not incur data transfer charges.",
    "NAT Gateway data-processing charges when private tasks pull over the internet path — interface endpoints have an hourly cost per AZ but often reduce overall spend for image-heavy deployments.",
    "Enhanced scanning through Amazon Inspector is billed separately from basic scanning.",
    "Cross-Region replication incurs inter-Region data transfer plus storage in the destination Region."
  ],
  commonMistakes: [
    "Deploying with the mutable 'latest' tag so a rollback or a re-deploy silently picks up a different image than the one tested.",
    "Forgetting the S3 gateway endpoint after adding ecr.api/ecr.dkr interface endpoints — the auth and manifest calls succeed but layer downloads time out.",
    "Placing Fargate tasks in private subnets without NAT or endpoints, producing 'CannotPullContainerError' on every task launch.",
    "Giving the task role (the application's role) ECR pull permissions instead of the task execution role, which is the identity the agent actually uses to pull.",
    "No lifecycle policy: hundreds of untagged images per repository accumulate and the storage bill keeps climbing.",
    "Baking secrets or .env files into image layers; anyone who can pull the image can read them.",
    "Treating a 'scan complete, 0 critical' result as permanent — new CVEs are published daily, so enable scan-on-push and continuous scanning."
  ],
  bestPractices: [
    "One repository per service (shop-web, shop-api, shop-worker); tag images with the git SHA and set tag immutability to 'Immutable'.",
    "Enable scan on push (or enhanced scanning) and gate deployments on the findings for critical/high CVEs.",
    "Attach a lifecycle policy: expire untagged images after a few days and keep only the last N tagged releases.",
    "Create ecr.api, ecr.dkr, S3 gateway, and logs interface endpoints so private tasks never depend on the NAT Gateway for pulls.",
    "Use multi-stage Docker builds and slim base images to speed up Fargate cold starts and reduce the attack surface.",
    "Encrypt repositories with a customer managed KMS key when compliance requires key control; otherwise the default AES-256 is fine.",
    "Reference the image by repository URI and immutable tag or digest in the task definition, and let CI/CD register a new revision per deploy."
  ],
  creationSteps: [
    "Open the AWS Console and go to Amazon ECR → Private registry → Repositories → Create repository.",
    "Enter a repository name such as shop/api (namespaces with '/' are allowed).",
    "Set Tag immutability to 'Immutable' so a pushed tag can never be overwritten.",
    "Under Image scan settings enable 'Scan on push' (or configure enhanced scanning at the registry level under Private registry → Scanning).",
    "Choose encryption: keep AES-256 or select KMS and pick a customer managed key.",
    "Click Create repository and copy the repository URI (<account>.dkr.ecr.<region>.amazonaws.com/shop/api).",
    "Open the repository → Lifecycle Policy → Create rule: expire untagged images older than 7 days, and keep only the latest 20 tagged images.",
    "From your build machine run 'aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com'.",
    "Build and tag the image with the repository URI and a git SHA tag, then docker push it.",
    "In VPC → Endpoints create interface endpoints for com.amazonaws.<region>.ecr.api and .ecr.dkr in the private app subnets with Private DNS enabled, plus a gateway endpoint for S3 attached to the private route tables.",
    "Reference the image URI in your ECS task definition and confirm the task execution role has the pull permissions."
  ],
  productionRecommendations: [
    "Immutable tags + git SHA tagging; never deploy 'latest' to production.",
    "Scan on push (or enhanced scanning) with a pipeline gate on critical findings.",
    "Lifecycle policy in every repository to bound storage cost.",
    "VPC endpoints (ecr.api, ecr.dkr, S3, logs) so pulls do not depend on the NAT Gateway.",
    "Least-privilege push role for CI/CD scoped to specific repository ARNs; pull-only task execution role.",
    "Cross-Region replication if you run or plan to fail over to a second Region."
  ],
  configExample: {
    title: "ECR lifecycle policy — expire untagged images, keep last 20 releases",
    lang: "json",
    code: `{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Expire untagged images older than 7 days",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 7
      },
      "action": { "type": "expire" }
    },
    {
      "rulePriority": 2,
      "description": "Keep only the 20 most recent release images",
      "selection": {
        "tagStatus": "tagged",
        "tagPrefixList": ["v"],
        "countType": "imageCountMoreThan",
        "countNumber": 20
      },
      "action": { "type": "expire" }
    }
  ]
}
// apply: aws ecr put-lifecycle-policy --repository-name shop/api --lifecycle-policy-text file://policy.json`
  },
  productionChecklist: [
    "One repository per service with tag immutability enabled.",
    "Scan on push or enhanced scanning enabled; findings reviewed in the pipeline.",
    "Lifecycle policy expires untagged images and caps tagged image count.",
    "Task execution role has pull permissions; CI/CD role has push scoped to repository ARNs.",
    "Private tasks pull via ecr.api + ecr.dkr interface endpoints and the S3 gateway endpoint (or a NAT Gateway is confirmed present).",
    "Images built with multi-stage builds; no secrets in layers.",
    "Task definitions reference a git SHA tag or digest, not 'latest'.",
    "KMS encryption chosen deliberately (default AES-256 or customer managed key).",
    "Cross-Region replication configured if a DR Region exists."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Push/pull authorization and the ECS task execution role that pulls images." },
    { id: "ecs", kind: "recommended", why: "The primary consumer of images in the reference architecture (Fargate tasks)." },
    { id: "nat-gateway", kind: "optional", why: "Needed for pulls from private subnets when no VPC endpoints exist." },
    { id: "s3", kind: "required", why: "Image layers are stored in and downloaded from S3; a private pull path needs the S3 gateway endpoint." },
    { id: "security-groups", kind: "optional", why: "Applies to interface endpoint ENIs (allow 443 from the task security group)." },
    { id: "route-tables", kind: "recommended", why: "Private route tables need the NAT route or the S3 gateway endpoint prefix-list route." },
    { id: "lambda", kind: "optional", why: "Container-image Lambda functions pull their image from ECR." },
    { id: "cloudwatch", kind: "optional", why: "Storage metrics and, via EventBridge, push/scan events for alerting." }
  ],
  related: ["ecs", "lambda", "s3", "nat-gateway", "iam"],
  ecommerceRole: "Stores the built images for the shop web/API service and the SQS order-processing worker. Every Fargate task start (deployments, autoscaling, replacement of unhealthy tasks) pulls from ECR, so it is on the critical path for deploying and scaling, but not for serving traffic that is already running.",
  failure: {
    title: "ECR is unavailable or an image is missing",
    whatHappens: "Running tasks keep serving traffic because their image is already on the Fargate host. New task launches fail with CannotPullContainerError (image not found, access denied, or network timeout), so deployments stall, autoscaling cannot add capacity, and ECS cannot replace tasks that crash — capacity slowly erodes under load. The most common causes are a deleted or expired tag, a task execution role missing pull permissions, or a private subnet with no NAT/endpoint path.",
    awsMechanisms: [
      "ECS service scheduler retries failed task launches and reports the stopped reason (visible in ECS console/DescribeTasks).",
      "ECS deployment circuit breaker (optional) rolls back a deployment whose tasks fail to start.",
      "Cross-Region replication provides an alternate registry in another Region.",
      "Pull-through cache rules shield you from upstream (Docker Hub) outages for base images."
    ],
    mitigations: [
      "Use immutable tags and lifecycle rules that keep the last N releases so a rollback target is never expired.",
      "Alarm on ECS service events / RunningTaskCount versus DesiredCount to detect launch failures quickly.",
      "Provision ecr.api, ecr.dkr and S3 endpoints so pulls do not fail with the NAT Gateway.",
      "Verify task execution role permissions in a staging cluster before promoting; enable the deployment circuit breaker."
    ]
  },
  beginnerConnectionHint: "Your CI/CD pipeline pushes images into ECR, and ECS/Fargate (or Lambda) pulls those images out when it starts a new container — through the NAT Gateway or private VPC endpoints."
},
{
  id: "iam",
  name: "AWS IAM",
  shortName: "IAM",
  fullName: "AWS Identity and Access Management",
  category: "identity",
  icon: "🔑",
  tagline: "Who (or what) may call which AWS API on which resource — the permission system of AWS",
  whatIsIt: "AWS IAM is the global service that defines identities (users, groups, roles) and policies that state which actions they may perform on which AWS resources. Every call to an AWS API — from a person in the console, a CI pipeline, or an ECS task reading an SQS queue — is authenticated and then authorized by IAM. It controls access to AWS itself, not access to your application's end users.",
  eli5: "Imagine a big building full of rooms (AWS services). IAM is the security desk that hands out badges. A badge says exactly which doors you may open and whether you may only look or also move things. Workers (like your app's robots) get badges too, but only for the doors they really need — the robot that delivers parcels cannot open the money room. Nobody gets in without a badge, and the badge decides what they can do.",
  technical: "IAM is a global control-plane service (identities and policies replicate to all Regions). A request is authenticated with long-lived credentials (user access keys, console password) or short-lived STS credentials (roles, obtained via sts:AssumeRole or automatically by services), then authorized by evaluating identity-based policies, resource-based policies, permissions boundaries, SCPs, and session policies. Any explicit Deny wins, otherwise at least one Allow is needed; the default is implicit deny. Roles have two policy types: a trust policy (who may assume the role) and permission policies (what the role may do). Service roles for ECS, Lambda, and EC2 deliver temporary credentials to the workload so no static keys are stored.",
  whyUse: [
    "You need to decide precisely which humans and which workloads can call which AWS APIs; there is no other way to do this — IAM is not optional.",
    "Roles give workloads short-lived, auto-rotated credentials so you never store access keys in code, images, or servers.",
    "Least privilege limits the blast radius: a compromised worker task cannot delete the database or read every S3 bucket.",
    "Every action is attributable in CloudTrail, which is essential for audits and incident response.",
    "Federation (IAM Identity Center, SAML/OIDC, GitHub Actions OIDC) lets humans and CI use their existing identity instead of long-lived IAM users."
  ],
  whenToUse: [
    "Any AWS resource access: ECS tasks reading SQS, Lambda writing DynamoDB, EC2 pulling from S3 — each needs a role with a policy.",
    "Granting humans console/CLI access, ideally via IAM Identity Center with MFA instead of IAM users with access keys.",
    "Letting CI/CD deploy (push to ECR, update ECS services) by assuming a role via OIDC federation.",
    "Cross-account access: a role in account B trusts account A's pipeline role.",
    "Letting AWS services act on your behalf (Auto Scaling, RDS Enhanced Monitoring, EventBridge invoking Step Functions) through service roles."
  ],
  whenNotToUse: [
    "Authenticating your shop's customers (login, signup, password reset): use Amazon Cognito or another identity provider — IAM identities are for AWS API access, not end users.",
    "Application-level permissions such as 'only the order's owner may view it': implement RBAC/ABAC in your application code or with Cognito groups and JWT claims.",
    "Storing application secrets or database passwords: IAM controls access to Secrets Manager/SSM Parameter Store, which hold the secrets.",
    "Network-level filtering ('only the app subnet may reach the database'): that is the job of security groups and NACLs; IAM does not see TCP packets.",
    "Long-lived IAM users for workloads or humans: prefer roles, IAM Identity Center, and OIDC federation; keep IAM users only for rare break-glass cases with MFA."
  ],
  placement: {
    scope: "global",
    subnet: "n/a",
    internetAccessible: true,
    summary: "IAM is a global AWS service; it has no presence inside your VPC. Identities and policies you create are available in every Region. Workloads call its companion service STS to obtain temporary credentials, and every AWS API endpoint they call consults IAM for authorization.",
    securityGroup: "Not applicable — IAM is a control-plane service with no ENIs. Security groups filter packets; IAM authorizes API calls.",
    nacl: "Not applicable — IAM does not sit in a subnet. Workloads in private subnets that must reach STS/other AWS APIs need outbound 443 through NAT or an STS interface endpoint.",
    routeTable: "Not applicable to IAM itself. Private subnets whose tasks call AWS APIs need 0.0.0.0/0 → NAT or interface endpoints (for example com.amazonaws.<region>.sts) — the policy evaluation happens server-side.",
    nat: "Not directly. NAT is only required for tasks in private subnets to reach AWS API endpoints over HTTPS when no interface VPC endpoints exist.",
    igw: "Not required by IAM. Console users reach IAM over the public internet; workloads inside the VPC reach AWS APIs via NAT/IGW or VPC endpoints.",
    vpcOptional: "Optional: an interface endpoint for STS (com.amazonaws.<region>.sts) lets private tasks refresh role credentials without NAT. IAM itself has no VPC endpoint because it is global."
  },
  dataFlow: {
    in: [
      "Administrative API calls (CreateRole, PutRolePolicy, AttachRolePolicy) from operators and infrastructure-as-code pipelines.",
      "Authentication requests: console sign-in, access-key-signed (SigV4) API calls, sts:AssumeRole / AssumeRoleWithWebIdentity from workloads and federated identities.",
      "Authorization checks from every AWS service endpoint: 'may principal X do action Y on resource Z with context C?'"
    ],
    out: [
      "Temporary credentials (access key, secret key, session token) delivered by STS to roles — to ECS tasks via the credentials endpoint, to EC2 via the instance metadata service, to Lambda via environment variables.",
      "Allow/Deny decisions returned to the calling service, which then executes or rejects the API call.",
      "CloudTrail records of every authentication and authorization event, plus IAM Access Analyzer findings and credential reports."
    ]
  },
  networking: [
    "IAM and STS are reached over HTTPS (443). The global STS endpoint is sts.amazonaws.com; regional STS endpoints (sts.<region>.amazonaws.com) are recommended for lower latency and resilience.",
    "ECS tasks fetch role credentials from the ECS agent's link-local credentials endpoint (169.254.170.2); EC2 instances fetch them from the instance metadata service (169.254.169.254) — both are local, no internet needed.",
    "Lambda receives its execution-role credentials as environment variables at cold start; no network configuration needed.",
    "Tasks in private subnets that call AWS APIs (SQS, S3, DynamoDB…) need NAT or interface/gateway VPC endpoints; IAM evaluation happens inside those services.",
    "Use IAM condition keys such as aws:SourceVpce or aws:SourceIp in policies to restrict where calls may come from, complementing network controls."
  ],
  security: {
    iam: "IAM is the security layer itself. Protect it with MFA on all human identities, no root access keys, a small number of administrators, and IAM Access Analyzer to detect over-broad or externally shared access.",
    securityGroups: "Independent layers: a task may have IAM permission to read SQS but still be blocked by a security group with no outbound 443; conversely open networking never grants API permission.",
    nacl: "Independent layer as well; IAM policies never override subnet-level packet filtering.",
    encryption: "IAM stores no application data. It controls who may use KMS keys (key policies + IAM policies together decide) and which principals can read encrypted S3 objects or secrets.",
    authentication: "Humans: IAM Identity Center or federated SAML/OIDC with MFA; break-glass IAM users with MFA. Workloads: roles (ECS task role, Lambda execution role, EC2 instance profile) with automatically rotated STS credentials — never static keys.",
    authorization: "Policy evaluation: explicit Deny > explicit Allow > implicit deny, across identity policies, resource policies, permissions boundaries, SCPs and session policies. Use Action + Resource ARNs + Condition keys to say exactly what is allowed.",
    secrets: "IAM credentials are secrets: never commit access keys; rotate any that exist; prefer roles so there is nothing to leak. IAM gates access to Secrets Manager and SSM Parameter Store where application secrets live.",
    leastPrivilege: "Start from zero, grant specific actions on specific ARNs, and use IAM Access Analyzer's 'generate policy from CloudTrail' to tighten policies over time. Avoid '*' actions and resources in workload roles."
  },
  iam: [
    "ECS task role (taskRoleArn): permissions the application code needs at runtime, e.g. sqs:ReceiveMessage/DeleteMessage on the orders queue ARN, s3:GetObject on the product-images bucket, secretsmanager:GetSecretValue on the DB secret. Trust policy principal: ecs-tasks.amazonaws.com.",
    "ECS task execution role (executionRoleArn): what the ECS agent needs to start the task — ECR pull actions, logs:CreateLogStream/PutLogEvents, and secretsmanager/ssm reads for secrets injected into the container. Trust principal: ecs-tasks.amazonaws.com. Keep it separate from the task role.",
    "Lambda execution role: at minimum AWSLambdaBasicExecutionRole (CloudWatch Logs); add AWSLambdaVPCAccessExecutionRole when attached to a VPC; plus dynamodb:PutItem/GetItem on the specific table ARN. Trust principal: lambda.amazonaws.com.",
    "EC2 instance profile: a container for a role trusted by ec2.amazonaws.com; the instance gets credentials from IMDS (enforce IMDSv2). Use AmazonSSMManagedInstanceCore for Session Manager instead of SSH keys.",
    "Administrators and CI/CD: iam:CreateRole, iam:AttachRolePolicy, iam:PassRole (scoped to the roles the pipeline may hand to ECS/Lambda) — iam:PassRole is the permission that lets one identity assign a role to a service, and it must be tightly scoped."
  ],
  scaling: [
    "IAM is a managed global service; you do not scale it. Authorization checks are performed inside every AWS service at request time.",
    "Account quotas exist (for example a default of 1,000 customer managed policies and a limit on managed policies attached per role); design roles per service rather than per task instance.",
    "Roles scale to any number of tasks/instances — thousands of Fargate tasks can share one task role and each receives its own temporary credentials.",
    "STS AssumeRole calls have per-account rate limits; use regional STS endpoints and cache credentials until expiry (the SDKs do this automatically).",
    "Use attribute-based access control (tags + aws:PrincipalTag / aws:ResourceTag conditions) to avoid an explosion of near-identical policies as the platform grows."
  ],
  availability: [
    "IAM is a global, highly available service; its data plane (authorization) is designed so that existing credentials keep working even if the control plane (creating/changing policies) is impaired.",
    "Changes to IAM policies are eventually consistent — allow seconds to propagate before assuming a new permission is active.",
    "Use regional STS endpoints so credential vending does not depend on a single global endpoint.",
    "Temporary credentials remain valid until expiry (up to the role's max session duration, 1 hour by default for role chaining, up to 12 hours configurable), providing a buffer during STS impairment.",
    "Keep a documented break-glass path (MFA-protected IAM user or Identity Center emergency access) in case federation with your external IdP fails."
  ],
  cost: [
    "IAM, STS, IAM Identity Center, and IAM Access Analyzer (account-level external access analysis) have no direct charge.",
    "Indirect cost: CloudTrail management events are free for the first copy; additional trails and data events (S3 object-level, Lambda invoke) are billed.",
    "Some Access Analyzer features (unused access analysis) and AWS Organizations-adjacent tools may carry a per-resource or per-analyzer charge — check current pricing.",
    "The real cost of poor IAM is operational: a breach from a leaked key or hours lost debugging AccessDenied — invest time in roles and least privilege."
  ],
  commonMistakes: [
    "Giving the task role the ECR/logs permissions the execution role needs (or vice versa) and then debugging 'CannotPullContainerError' or missing logs for hours.",
    "Attaching AdministratorAccess or PowerUserAccess to a workload role 'to make it work' and never removing it.",
    "Creating IAM users with access keys for applications, then committing the keys to git or baking them into Docker images.",
    "Using '*' for Resource on actions that support resource ARNs (e.g. s3:GetObject on every bucket in the account).",
    "Forgetting iam:PassRole for the pipeline, so deployments fail when they try to assign the task role to a new task definition.",
    "Confusing IAM (AWS API authorization) with end-user login — trying to create an IAM user per customer.",
    "Editing the trust policy incorrectly (wrong service principal such as ecs.amazonaws.com instead of ecs-tasks.amazonaws.com) so the role cannot be assumed, or leaving the root user and administrators without MFA."
  ],
  bestPractices: [
    "Lock away the root user: MFA, no access keys, use only for tasks that require it.",
    "Humans sign in through IAM Identity Center (or federation) with MFA; no long-lived IAM user keys.",
    "One role per workload (shop-api-task-role, shop-worker-task-role, order-events-lambda-role) with policies scoped to specific ARNs.",
    "Separate ECS task role (application permissions) from task execution role (agent permissions to pull image, write logs, read secrets).",
    "CI/CD authenticates with OIDC federation (GitHub Actions/GitLab → AssumeRoleWithWebIdentity) and is granted iam:PassRole only for specific role ARNs.",
    "Guardrails: permissions boundaries for roles created by developers/pipelines, SCPs at the Organization level, IAM Access Analyzer reviews to remove unused permissions, and CloudTrail enabled in all Regions.",
    "Enforce IMDSv2 on EC2 so instance credentials cannot be stolen through SSRF."
  ],
  creationSteps: [
    "Open the AWS Console and go to IAM → Roles → Create role.",
    "Select 'AWS service' as the trusted entity type, choose 'Elastic Container Service', then the use case 'Elastic Container Service Task' (this writes the trust policy for ecs-tasks.amazonaws.com).",
    "Click Next; skip attaching AWS managed policies for the application role (you will add a custom least-privilege policy).",
    "Name the role shop-worker-task-role, add tags (service=shop-worker, env=prod), and click Create role.",
    "Open the role → Permissions → Add permissions → Create inline policy → JSON, and paste a policy allowing sqs:ReceiveMessage, sqs:DeleteMessage, sqs:GetQueueAttributes on the orders queue ARN and secretsmanager:GetSecretValue on the DB secret ARN.",
    "Repeat 'Create role' for the task execution role: same trusted entity (ECS Task), attach the AWS managed policy AmazonECSTaskExecutionRolePolicy, and name it shop-ecs-execution-role.",
    "If the execution role must inject secrets, add an inline policy with secretsmanager:GetSecretValue (and kms:Decrypt if a customer managed key is used) on the specific secret ARNs.",
    "For a Lambda function, create a role with trusted entity 'Lambda', attach AWSLambdaBasicExecutionRole, and add a custom policy scoped to the DynamoDB table ARN.",
    "For EC2, create a role trusted by 'EC2' with AmazonSSMManagedInstanceCore; the console creates the instance profile automatically.",
    "In the ECS task definition set Task role = shop-worker-task-role and Task execution role = shop-ecs-execution-role; in Lambda set the execution role; in the EC2 launch template select the instance profile.",
    "Deploy, then check CloudTrail / CloudWatch Logs for AccessDenied errors and tighten or add only the specific actions that are missing."
  ],
  productionRecommendations: [
    "Roles everywhere; zero long-lived access keys for workloads or CI.",
    "Task role and task execution role are separate, each with ARN-scoped policies.",
    "MFA enforced for humans; Identity Center or federation instead of IAM users.",
    "Permissions boundaries + SCP guardrails so no pipeline can create an admin role.",
    "CloudTrail enabled in all Regions with log file validation; alerts on root usage and policy changes.",
    "Quarterly review with IAM Access Analyzer to remove unused permissions and roles."
  ],
  configExample: {
    title: "Least-privilege ECS task role — trust policy + permission policy",
    lang: "json",
    code: `// Trust policy (who may assume the role): the ECS tasks service principal
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "ecs-tasks.amazonaws.com" },
    "Action": "sts:AssumeRole",
    "Condition": { "ArnLike": { "aws:SourceArn": "arn:aws:ecs:eu-west-1:123456789012:*" } }
  }]
}

// Permission policy (what the role may do): SQS worker reading the orders queue
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ConsumeOrdersQueue",
      "Effect": "Allow",
      "Action": ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:ChangeMessageVisibility"],
      "Resource": "arn:aws:sqs:eu-west-1:123456789012:shop-orders"
    },
    {
      "Sid": "ReadDbSecret",
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "arn:aws:secretsmanager:eu-west-1:123456789012:secret:shop/prod/db-*"
    }
  ]
}`
  },
  productionChecklist: [
    "Root user has MFA and no access keys.",
    "All human access via IAM Identity Center/federation with MFA; no IAM user access keys in use.",
    "Every ECS service has a distinct task role and a shared or per-service execution role.",
    "Every Lambda function has its own execution role scoped to the resources it touches.",
    "EC2 instances use instance profiles with IMDSv2 required.",
    "No policy in a workload role uses Action '*' or Resource '*' where ARNs are supported.",
    "iam:PassRole in the CI/CD role is restricted to specific role ARNs.",
    "CloudTrail is on in all Regions; alarms exist for root login and IAM policy changes.",
    "IAM Access Analyzer has no unresolved external-access findings.",
    "Trust policies use the correct service principals (ecs-tasks, lambda, ec2) and, where possible, aws:SourceArn/aws:SourceAccount conditions."
  ],
  dependencies: [
    { id: "cloudwatch", kind: "recommended", why: "CloudTrail/CloudWatch capture authentication and AccessDenied events for auditing and alarms." },
    { id: "ecs", kind: "optional", why: "ECS tasks consume task roles and task execution roles." },
    { id: "lambda", kind: "optional", why: "Lambda functions run under an execution role." },
    { id: "ec2", kind: "optional", why: "EC2 instances receive role credentials via an instance profile." },
    { id: "authorization", kind: "alternative", why: "For end-user identity and application permissions use Cognito/JWT authorization, not IAM identities." }
  ],
  related: ["authorization", "security-groups", "ecs", "lambda", "ec2", "ecr"],
  ecommerceRole: "IAM is the invisible glue: the API tasks get a role that may read the product bucket and the DB secret, the worker role may consume the orders queue, the Lambda role may write DynamoDB, and the pipeline role may push to ECR and update services. No component uses a static key.",
  failure: {
    title: "IAM role or policy is misconfigured",
    whatHappens: "The AWS API returns AccessDenied (HTTP 403) or, for a broken trust policy, the workload cannot obtain credentials at all. Symptoms differ by layer: a wrong execution role produces CannotPullContainerError or missing logs; a wrong task role produces runtime errors such as 'AccessDenied for sqs:ReceiveMessage', so the worker starts but processes nothing; a Lambda whose role lacks VPC permissions fails to create its ENIs and cannot be invoked. Because policy changes are eventually consistent, an over-eager fix may seem not to work for a few seconds. The opposite failure — an over-permissive policy — has no visible symptom until a compromise.",
    awsMechanisms: [
      "Explicit AccessDenied errors with the action and, in newer error messages, the missing permission and policy type.",
      "CloudTrail records each denied call with the principal, action, and resource.",
      "IAM policy simulator and Access Analyzer's policy validation catch many mistakes before deployment.",
      "Role credentials expire and refresh automatically, so a fixed policy takes effect without restarting tasks (after propagation)."
    ],
    mitigations: [
      "Test roles in a staging account with the same infrastructure-as-code before production.",
      "Alarm on a spike of AccessDenied events in CloudTrail Lake/CloudWatch Logs metric filters.",
      "Keep the task role / execution role distinction explicit in code review checklists.",
      "Use Access Analyzer policy validation and permissions boundaries so misconfigurations fail closed, never open."
    ]
  },
  beginnerConnectionHint: "Every AWS service asks IAM 'is this caller allowed?' before doing anything — your ECS tasks, Lambda functions, EC2 instances and pipelines all carry an IAM role that answers that question."
},
{
  id: "security-groups",
  name: "Security Groups",
  shortName: "Security Groups",
  fullName: "Amazon VPC Security Groups",
  category: "identity",
  icon: "🛡️",
  tagline: "Stateful virtual firewall on each ENI — allow rules only, can reference other SGs",
  whatIsIt: "A security group is a stateful virtual firewall attached to elastic network interfaces (ENIs) of resources in a VPC — EC2 instances, ECS tasks, ALBs, RDS instances, Lambda functions in a VPC, and VPC endpoints. It contains allow rules for inbound and outbound traffic by protocol, port, and source/destination (CIDR, prefix list, or another security group). Anything not explicitly allowed is denied.",
  eli5: "A security group is like a bouncer standing at the door of each room in your shop. The bouncer has a guest list: 'let in anyone from the front desk on door 443' or 'let in only the kitchen staff through door 5432'. If your name is not on the list, you cannot come in. And the bouncer remembers who went in, so when they walk out again they do not need a separate pass.",
  technical: "Security groups operate at the ENI level and are stateful: connection tracking allows return traffic for any permitted flow regardless of outbound/inbound rules. Rules are allow-only (no deny) and are evaluated as a set — if any rule matches, traffic is permitted. Sources and destinations can be IPv4/IPv6 CIDRs, managed prefix lists, or security group IDs (in the same VPC or a peered VPC); referencing an SG matches the private IPs of all ENIs currently associated with it. Up to 5 security groups can be attached per ENI by default, and rule changes apply immediately to existing connections' future packets.",
  whyUse: [
    "You need to restrict which components can talk to each other over which ports without maintaining IP lists — SG references follow tasks and instances as they scale.",
    "Stateful behaviour means you only write rules for the initiating direction; return traffic is handled automatically.",
    "Tiered rules (ALB → app → database) implement defence in depth so a compromised web tier still cannot reach the database on anything but the engine port.",
    "Rules take effect immediately and are managed per resource, which fits infrastructure-as-code and blue/green deployments.",
    "Security groups work for resources that have no subnet-level identity of their own, such as individual Fargate tasks."
  ],
  whenToUse: [
    "Every ENI-bearing resource in the reference architecture: ALB, ECS Fargate tasks, EC2 instances, RDS instances, NAT-facing interface endpoints, and VPC-attached Lambda functions.",
    "Restricting RDS to accept 5432 only from the ECS task security group and a bastion/SSM security group.",
    "Allowing the ALB to reach ECS tasks on the container port, and the internet to reach the ALB on 443 only.",
    "Locking interface VPC endpoints (ECR, Secrets Manager, logs) to 443 from the application security group.",
    "Permitting service-to-service traffic inside the VPC (worker → RDS, API → cache) without knowing IP addresses."
  ],
  whenNotToUse: [
    "You need to explicitly DENY a specific IP or CIDR (e.g. block a scanner): security groups have no deny rules — use a Network ACL or AWS WAF on the ALB/CloudFront.",
    "Subnet-wide guardrails that every future resource must obey regardless of its SG: use NACLs as a second, subnet-level layer.",
    "Filtering HTTP requests by path, header, or rate (bot protection, SQL injection): use AWS WAF; security groups only see IP/port/protocol.",
    "Controlling access to regional services like S3 or DynamoDB: they have no SG; use IAM policies, bucket policies, and VPC endpoint policies.",
    "Authorizing users or API calls: that is IAM (AWS APIs) or your application/Cognito (end users) — security groups know nothing about identities."
  ],
  placement: {
    scope: "vpc-edge",
    subnet: "any",
    internetAccessible: false,
    summary: "Security groups are VPC-scoped objects attached to ENIs in any subnet. In the reference architecture there are at least four: alb-sg (public subnets), ecs-sg (private app subnets), rds-sg (private DB subnets), and endpoints-sg for interface VPC endpoints.",
    securityGroup: "This IS the security group layer. Each resource carries its own SG; rules reference each other: alb-sg allows 443 from 0.0.0.0/0, ecs-sg allows the container port from alb-sg, rds-sg allows 5432 from ecs-sg.",
    nacl: "NACLs are a separate, stateless, subnet-level layer evaluated before traffic reaches the ENI. Both must allow the traffic; most teams keep default allow-all NACLs and do their filtering in security groups.",
    routeTable: "Independent. A security group can allow a port but if the route table has no path (e.g. no NAT route) the packet never arrives. Routing decides the path; the SG decides whether the ENI accepts it.",
    nat: "Not applicable to the SG itself. Note the NAT Gateway has no security group; outbound rules of the ecs-sg (usually allow all outbound, or 443 only) govern traffic that will leave via NAT.",
    igw: "Not applicable. The IGW has no security group; the ALB's SG is what limits what the internet can reach (443 only)."
  },
  dataFlow: {
    in: [
      "Inbound packets destined to the ENI are matched against inbound allow rules (protocol, port range, source CIDR/SG/prefix list).",
      "Return packets of connections the resource initiated are allowed automatically by connection tracking.",
      "Rule changes from the console, CLI, or Terraform (authorize/revoke ingress/egress) apply immediately."
    ],
    out: [
      "Outbound packets are matched against outbound allow rules (default: allow all outbound).",
      "Return packets of allowed inbound connections flow out regardless of outbound rules.",
      "Dropped traffic is silently discarded (no ICMP reject); VPC Flow Logs record REJECT entries in CloudWatch Logs or S3 for troubleshooting."
    ]
  },
  networking: [
    "Reference architecture chain: Internet → 443 → alb-sg → container port (e.g. 8080) → ecs-sg → 5432 → rds-sg. Each hop allows only the previous SG as source.",
    "Security group references work only within the same VPC (or a peered VPC in the same Region); across VPN/Direct Connect you must use CIDRs.",
    "For an ALB with Fargate tasks in awsvpc mode, the target is the task ENI, so the ecs-sg must allow the container port from alb-sg — not from the ALB's IPs.",
    "Health checks come from the ALB's ENIs, so the same alb-sg rule covers them; if the health check port differs from the traffic port, allow it too.",
    "Interface VPC endpoints need an SG allowing inbound 443 from ecs-sg; the S3/DynamoDB gateway endpoints have no SG (route-table based)."
  ],
  security: {
    iam: "IAM controls who may create or change security groups (ec2:AuthorizeSecurityGroupIngress, ec2:RevokeSecurityGroupEgress, ec2:CreateSecurityGroup…). Restrict these to the infrastructure pipeline and network administrators; use ec2:ResourceTag conditions to scope by environment.",
    securityGroups: "Design principle: one SG per tier or service, source rules referencing SG IDs instead of CIDRs, inbound restricted to the needed port, and outbound tightened where practical (e.g. rds-sg with no outbound rules needed beyond return traffic).",
    nacl: "Complementary stateless layer; a permissive SG can be backstopped by a NACL that denies a known-bad CIDR or restricts the DB subnet to app subnet CIDRs.",
    encryption: "Security groups do not encrypt anything; allowing only 443 to the ALB (and redirecting 80 → 443) ensures external traffic is TLS. Internal TLS to RDS is enforced by the database parameter, not by the SG.",
    authentication: "None — security groups match on network attributes, not identities. Membership in an SG acts as a coarse 'identity' of the workload tier.",
    authorization: "Rules are the authorization: which source may open a TCP/UDP connection to which port. There is no deny; absence of an allow rule is the deny.",
    secrets: "Not applicable — no credentials involved. Do not treat SG-level access as a substitute for database authentication.",
    leastPrivilege: "Allow exactly the port from exactly the upstream SG. Never use 0.0.0.0/0 for anything but the public ALB listener ports (and even that can be narrowed to the CloudFront managed prefix list)."
  },
  iam: [
    "Network administrators / IaC pipeline: ec2:CreateSecurityGroup, ec2:AuthorizeSecurityGroupIngress, ec2:AuthorizeSecurityGroupEgress, ec2:RevokeSecurityGroupIngress, ec2:RevokeSecurityGroupEgress, ec2:DeleteSecurityGroup, ec2:CreateTags — scoped with conditions on ec2:Vpc or resource tags.",
    "Read-only for developers and auditors: ec2:DescribeSecurityGroups, ec2:DescribeSecurityGroupRules.",
    "Services that create ENIs (ECS, Lambda in VPC, RDS) need permission to reference the SG when creating network interfaces; ECS gets this through the service-linked role, Lambda via AWSLambdaVPCAccessExecutionRole.",
    "Deny ec2:AuthorizeSecurityGroupIngress with 0.0.0.0/0 on non-web ports via SCP or a permissions boundary; AWS Config rules (restricted-ssh, vpc-sg-open-only-to-authorized-ports) can detect drift.",
    "Security Hub / Firewall Manager (optional) need service roles to audit or centrally manage SGs across accounts."
  ],
  scaling: [
    "Security groups scale with the resources: a rule referencing ecs-sg automatically covers every new Fargate task ENI that carries ecs-sg — no rule changes during autoscaling.",
    "Default quotas: 60 inbound and 60 outbound rules per SG, 5 SGs per ENI, 2,500 SGs per VPC (all adjustable); rules-per-ENI (SGs × rules) has a combined limit — keep rule counts small.",
    "Use managed prefix lists to bundle many CIDRs (e.g. office ranges, CloudFront origin-facing IPs) into one rule entry.",
    "SG evaluation is performed in the VPC data plane with no throughput penalty you need to plan for.",
    "For very many microservices, standardize on a few tier SGs plus service-specific SGs rather than a unique SG per port pairing."
  ],
  availability: [
    "Security groups are VPC-wide and inherently multi-AZ; there is nothing to replicate or fail over.",
    "Rule changes apply immediately across all AZs to all attached ENIs.",
    "Connection tracking state is per ENI; new tasks in another AZ simply inherit the SG's rules.",
    "Misconfiguration, not outage, is the availability risk — a wrong rule blocks an entire tier instantly. Manage via IaC with review and use AWS Config rules to detect drift.",
    "Keep an emergency runbook: how to add a temporary rule (via IaC or console) and remove it afterwards."
  ],
  cost: [
    "Security groups themselves are free — no hourly or per-rule charge.",
    "VPC Flow Logs used to troubleshoot rejected traffic are billed by ingestion/storage in CloudWatch Logs or S3.",
    "AWS Config rules that audit SGs and Security Hub checks incur per-evaluation/per-check charges.",
    "Indirect cost: over-open groups can lead to breach-related costs; over-tight groups cause outages and engineering time."
  ],
  commonMistakes: [
    "Allowing 0.0.0.0/0 on the database port or SSH (22) 'temporarily' and forgetting to remove it.",
    "Using the ALB's current IP addresses as the source for the ECS SG; ALB IPs change and the rule silently breaks.",
    "Forgetting the ECS SG must allow the container port from the ALB SG when tasks run in awsvpc mode (the rule belongs on the task SG, not the instance).",
    "Trying to write a deny rule — security groups cannot deny; a NACL or WAF is needed.",
    "Attaching the same catch-all SG to every resource so the 'tiers' are only nominal.",
    "Leaving the default security group in use, which allows all traffic between members of that group.",
    "Assuming an SG blocks return traffic — it is stateful; removing an outbound rule does not stop responses to allowed inbound connections."
  ],
  bestPractices: [
    "One SG per tier/service: alb-sg, ecs-sg (or per service), rds-sg, endpoints-sg, bastion-sg; name and tag them consistently.",
    "Source rules by SG ID, not CIDR, for anything inside the VPC.",
    "Public ingress only on alb-sg (443, and 80 for redirect); optionally restrict it to the CloudFront origin-facing managed prefix list.",
    "Tighten outbound rules where feasible: rds-sg needs no outbound rules; ecs-sg can be limited to 443 (AWS APIs via NAT/endpoints) plus 5432 to rds-sg.",
    "Manage SGs in Terraform/CloudFormation and forbid console edits in production; enable AWS Config rules to detect open ports.",
    "Enable VPC Flow Logs (REJECT at least) to diagnose blocked traffic quickly.",
    "Remove rules and unused SGs regularly; every unused rule is a future incident."
  ],
  creationSteps: [
    "Open the AWS Console and go to VPC → Security → Security groups → Create security group.",
    "Name it alb-sg, select the shop VPC (10.0.0.0/16), add inbound rules HTTPS 443 and HTTP 80 from 0.0.0.0/0 (and ::/0 if IPv6), leave outbound allow-all, and click Create.",
    "Create ecs-sg in the same VPC: inbound rule Custom TCP, port 8080 (your container port), source = alb-sg (start typing 'sg-' and pick alb-sg).",
    "Create rds-sg: inbound rule PostgreSQL 5432 (or MySQL 3306), source = ecs-sg. Optionally add a second 5432 rule from bastion-sg for admins.",
    "Create endpoints-sg: inbound HTTPS 443, source = ecs-sg, for interface VPC endpoints (ECR, Secrets Manager, CloudWatch Logs).",
    "Edit ecs-sg outbound rules: replace allow-all with 443 to 0.0.0.0/0 (AWS APIs via NAT) and 5432 to rds-sg — or keep allow-all if your team prefers simplicity.",
    "Attach alb-sg to the load balancer (EC2 → Load Balancers → Security), ecs-sg in the ECS service's network configuration, rds-sg to the RDS instance, endpoints-sg to each interface endpoint.",
    "Tag every SG with Name, Environment, and Service so audits can map rules to owners.",
    "Enable VPC Flow Logs on the VPC (destination CloudWatch Logs) to see REJECT records while validating.",
    "Test: curl the ALB DNS name over 443; from an ECS task run a psql/nc test to the RDS endpoint on 5432; confirm a direct connection from the public subnet to RDS fails."
  ],
  productionRecommendations: [
    "Tiered SGs with SG-ID sources: Internet → alb-sg:443 → ecs-sg:8080 → rds-sg:5432.",
    "No 0.0.0.0/0 anywhere except alb-sg 443/80; consider the CloudFront managed prefix list.",
    "Do not use the VPC default security group; leave it with no rules.",
    "Manage via IaC with peer review; AWS Config rules to detect public-open ports.",
    "VPC Flow Logs enabled for rejects; alarms on unexpected REJECT volumes.",
    "Quarterly review to prune unused SGs and rules."
  ],
  configExample: {
    title: "Terraform — tiered security groups with SG-to-SG references",
    lang: "hcl",
    code: `resource "aws_security_group" "alb" {
  name   = "alb-sg"
  vpc_id = aws_vpc.shop.id                       # 10.0.0.0/16
  ingress { from_port = 443; to_port = 443; protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 80;  to_port = 80;  protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] } # redirect to 443
  egress  { from_port = 0;   to_port = 0;   protocol = "-1";  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "ecs" {
  name   = "ecs-sg"
  vpc_id = aws_vpc.shop.id
  ingress {                                      # only the ALB may reach the container port
    from_port = 8080; to_port = 8080; protocol = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress { from_port = 443;  to_port = 443;  protocol = "tcp"; cidr_blocks = ["0.0.0.0/0"] } # AWS APIs via NAT/endpoints
  egress { from_port = 5432; to_port = 5432; protocol = "tcp"; security_groups = [aws_security_group.rds.id] }
}

resource "aws_security_group" "rds" {
  name   = "rds-sg"
  vpc_id = aws_vpc.shop.id
  ingress {                                      # only ECS tasks may reach PostgreSQL
    from_port = 5432; to_port = 5432; protocol = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
  # no egress rules needed: SGs are stateful, replies to allowed inbound flows are permitted
}`
  },
  productionChecklist: [
    "alb-sg is the only SG with 0.0.0.0/0 inbound, and only on 443/80.",
    "ecs-sg allows the container port only from alb-sg.",
    "rds-sg allows the engine port only from ecs-sg (and a bastion/SSM SG if needed).",
    "Interface endpoint SG allows 443 only from ecs-sg.",
    "No resource uses the VPC default security group.",
    "No inbound rule allows 22/3389 from the internet; admin access via SSM Session Manager.",
    "All SGs are defined in IaC and tagged with owner/environment.",
    "AWS Config rules (restricted-common-ports, vpc-sg-open-only-to-authorized-ports) are enabled.",
    "VPC Flow Logs are on and REJECT records are reviewed."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "Security groups are created within a VPC and can only be attached to ENIs in that VPC." },
    { id: "iam", kind: "required", why: "IAM permissions govern who can create and modify rules." },
    { id: "alb", kind: "recommended", why: "alb-sg is the public entry point and the source for the ECS tier rule." },
    { id: "ecs", kind: "recommended", why: "Fargate tasks carry ecs-sg on their ENIs and are the source for the RDS rule." },
    { id: "rds", kind: "recommended", why: "rds-sg protects the database port." },
    { id: "nacl", kind: "alternative", why: "Use a NACL when you need subnet-wide or explicit deny rules." },
    { id: "cloudwatch", kind: "optional", why: "VPC Flow Logs for rejected traffic can be sent to CloudWatch Logs." }
  ],
  related: ["nacl", "vpc", "subnets", "alb", "ecs", "rds"],
  ecommerceRole: "Security groups enforce the tiering of the shop: the internet reaches only the ALB on 443, the ALB reaches only the ECS tasks on the container port, and only the ECS tasks (API and SQS worker) reach RDS on 5432. Interface endpoints for ECR and Secrets Manager accept 443 only from the tasks.",
  failure: {
    title: "Security group rule is wrong or too open",
    whatHappens: "Too tight: traffic is silently dropped — the ALB marks targets unhealthy and returns 502/503, ECS tasks cannot reach RDS and time out, or tasks cannot reach ECR/Secrets Manager and fail to start. No error is sent to the client, so it looks like a network black hole. Too open: everything works, which is why it goes unnoticed; a 0.0.0.0/0 rule on 5432 or 22 exposes the database or hosts to brute force and scanning bots within minutes, and a flat SG shared by every tier lets a compromised web container reach the database directly.",
    awsMechanisms: [
      "VPC Flow Logs show REJECT records with source, destination, and port for dropped traffic.",
      "VPC Reachability Analyzer explains which SG or NACL rule blocks a path between two ENIs.",
      "ALB target health checks and ECS service events surface tier-to-tier connectivity failures.",
      "AWS Config managed rules and Security Hub findings flag open ports and unrestricted SSH/RDP.",
      "Stateful tracking means a rule fix takes effect on the next connection attempt without restarts."
    ],
    mitigations: [
      "Manage SGs in IaC with code review; block 0.0.0.0/0 on non-web ports with an SCP or policy-as-code check.",
      "Enable Flow Logs and Reachability Analyzer for fast diagnosis when a tier goes unhealthy after a change.",
      "Alert on Config rule non-compliance and on ALB UnHealthyHostCount/5xx spikes after deploys.",
      "Use SG references rather than CIDRs so scaling events never require rule changes."
    ]
  },
  beginnerConnectionHint: "Every box in the diagram wears a security group like a badge: the ALB's badge lets the internet in on 443, the ECS badge lets only the ALB in, and the RDS badge lets only the ECS tasks in."
},
{
  id: "authorization",
  name: "Application Authorization",
  shortName: "Authorization",
  fullName: "End-user Authentication & Authorization (Cognito / OIDC / JWT)",
  category: "identity",
  icon: "🎫",
  tagline: "How the shop knows who its customers are and what they may do — separate from IAM",
  whatIsIt: "Application authorization is the layer that decides whether a logged-in end user (a shopper or an admin) may perform an action such as viewing an order or issuing a refund. It is built from an identity provider (Amazon Cognito user pools or a third-party OIDC provider) that issues tokens after authentication, token validation at the edge (API Gateway authorizers or the ALB's OIDC authentication action), and role-based or attribute-based checks inside the application. It is distinct from IAM, which authorizes AWS API calls between services.",
  eli5: "Think of a concert. First you show your ticket at the entrance to prove you really bought one — that is logging in. Then the ticket says where you may sit: floor, balcony, or backstage. The staff check it at every door, and a backstage pass does not appear just because you asked nicely. In our shop, the ticket is a token, checking it at the entrance is authentication, and the seat printed on it is authorization.",
  technical: "Authentication (AuthN) proves identity: the user signs in with Cognito (or an external IdP through OIDC/SAML federation) and receives a JWT ID token and access token signed with the pool's RS256 keys, published at the JWKS URL. Authorization (AuthZ) decides what that identity may do: API Gateway validates the JWT (HTTP API JWT authorizer, REST API Cognito authorizer, or a Lambda authorizer for custom logic) and forwards claims to Lambda; the ALB can perform OIDC authentication itself and pass claims in x-amzn-oidc-* headers to ECS; the application then applies RBAC/ABAC based on claims such as cognito:groups, sub, or custom attributes. Service-to-service calls (ECS → SQS, Lambda → DynamoDB) are authorized by IAM roles and SigV4 signatures, not by user tokens.",
  whyUse: [
    "You must know who is calling before showing an order or charging a card; unauthenticated APIs leak data and get abused.",
    "Offloading login, password policy, MFA, and social/enterprise federation to Cognito or an IdP avoids building fragile custom auth.",
    "Validating tokens at API Gateway or the ALB rejects unauthenticated traffic before it reaches (and costs) your compute.",
    "Claims in the token (groups, roles, tenant) let the backend enforce RBAC consistently across ECS and Lambda paths.",
    "Short-lived access tokens with refresh tokens limit the damage of a leaked token and enable revocation by disabling the user."
  ],
  whenToUse: [
    "Customer-facing APIs of the shop (cart, checkout, order history) that must be tied to a signed-in user.",
    "Admin/back-office endpoints where only staff in an 'admins' group may issue refunds or edit products.",
    "Serverless API Gateway → Lambda paths: use a JWT/Cognito authorizer so Lambda never runs for anonymous requests.",
    "Container paths behind the ALB: use the ALB OIDC authentication action for browser sessions, or validate JWTs in Express middleware for API clients.",
    "Multi-tenant or B2B scenarios where enterprise customers sign in with their own SAML/OIDC provider federated into Cognito."
  ],
  whenNotToUse: [
    "Authorizing one AWS service to call another (ECS reading SQS, Lambda writing DynamoDB): use IAM roles and SigV4, not user tokens.",
    "Public catalogue pages and product images that anyone may view: serve them unauthenticated from CloudFront/S3 and cache aggressively.",
    "Machine-to-machine calls from partner systems: use OAuth 2.0 client-credentials (Cognito app client with client secret and resource server scopes) or IAM authorization with SigV4 rather than user accounts.",
    "Rolling your own password hashing and session store when Cognito or an established IdP fits: custom auth is a frequent source of breaches.",
    "Network-level restrictions ('only the office may reach admin'): that is security groups, WAF IP sets, or a VPN — a complement, not a replacement."
  ],
  placement: {
    scope: "concept",
    subnet: "n/a",
    internetAccessible: true,
    summary: "Not a single deployable resource. It is a pattern spanning an identity provider (Cognito — a regional service outside your VPC, reached over public HTTPS), token validation at the entry point (API Gateway authorizer or ALB authentication action), and permission checks inside ECS tasks or Lambda functions.",
    securityGroup: "Not applicable — Cognito and API Gateway have no ENIs in your VPC. Security groups still protect the ALB and ECS tasks that perform token checks, but they do not participate in authorization decisions.",
    nacl: "Not applicable — no subnet is involved for Cognito/API Gateway. Tasks in private subnets that fetch the JWKS (public keys) or call Cognito APIs need outbound 443 and inbound ephemeral ports, which the default NACL allows.",
    routeTable: "Not applicable directly. Private app subnets need 0.0.0.0/0 → NAT so ECS tasks can download JWKS from cognito-idp.<region>.amazonaws.com and, for the ALB OIDC action, the ALB (in public subnets) needs an IGW route to reach the IdP.",
    nat: "Not applicable as a resource. Recommended indirectly: ECS tasks validating tokens locally need to fetch the JWKS once (and cache it), which requires NAT or internet egress from private subnets. API Gateway authorizers run outside your VPC and need nothing.",
    igw: "Not applicable as a resource. The ALB OIDC authentication action requires the ALB to reach the IdP's token endpoint over the internet, so the public subnets' IGW route is required in that design.",
    vpcOptional: "Cognito user pools have no VPC endpoint option. API Gateway private endpoints and interface VPC endpoints for execute-api are optional for internal APIs; Cognito is always reached over the public AWS endpoint."
  },
  dataFlow: {
    in: [
      "Sign-in requests (username/password, MFA code, social or SAML assertions) from the browser or mobile app to Cognito's hosted UI or InitiateAuth API.",
      "API requests carrying Authorization: Bearer <access token> headers to API Gateway or the ALB/ECS API.",
      "JWKS fetches from the application to https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json to verify signatures."
    ],
    out: [
      "ID, access, and refresh tokens (JWTs) returned to the client after successful authentication.",
      "Validated claims forwarded to Lambda (event.requestContext.authorizer.jwt.claims) or to ECS via x-amzn-oidc-data / x-amzn-oidc-identity headers.",
      "401 Unauthorized (missing/invalid token) or 403 Forbidden (valid identity but insufficient scope/role) responses to the client.",
      "Sign-in/sign-up events to CloudWatch Logs and Cognito triggers (pre-sign-up, post-authentication Lambda) for custom logic."
    ]
  },
  networking: [
    "All auth traffic is HTTPS 443: clients to Cognito, clients to API Gateway/ALB, and servers to the JWKS endpoint.",
    "Cognito user pool endpoints are public regional endpoints (cognito-idp.<region>.amazonaws.com and your hosted UI domain); they have no VPC endpoint.",
    "ECS tasks in private subnets need NAT egress (or an internet path) to fetch and periodically refresh the JWKS; cache keys in memory to avoid a fetch per request.",
    "The ALB OIDC action needs the ALB to reach the IdP issuer/token endpoints and a redirect callback path (/oauth2/idpresponse) registered in the IdP app client.",
    "Use a custom domain for the hosted UI and API with ACM certificates so cookies and CORS behave predictably; CloudFront can front both."
  ],
  security: {
    iam: "IAM secures the plumbing, not the users: the Lambda authorizer's execution role, permissions to configure Cognito (cognito-idp:*), and API Gateway's permission to invoke Lambda. Optionally, Cognito identity pools exchange user tokens for temporary IAM credentials when a browser must call AWS APIs directly (e.g. S3 uploads).",
    securityGroups: "Not applicable to Cognito/API Gateway. The ECS tasks that verify tokens remain protected by ecs-sg allowing the container port from alb-sg.",
    nacl: "Not applicable to Cognito/API Gateway; standard outbound 443 / inbound ephemeral for tasks fetching JWKS.",
    encryption: "Tokens travel only over TLS; refresh tokens must be stored securely on the client (HttpOnly Secure cookies for web, secure storage for mobile). Cognito encrypts user data at rest; enforce TLS on custom domains via ACM.",
    authentication: "Cognito user pool handles passwords (SRP), MFA (TOTP/SMS), adaptive/advanced security features, and federation with Google, Apple, SAML, or OIDC providers. Tokens are JWTs signed RS256; validate issuer, audience/client_id, expiry, and token_use.",
    authorization: "Layered: API Gateway JWT authorizer checks signature, issuer, audience, and optional scopes; the ALB authenticates sessions; application code enforces RBAC from cognito:groups or custom claims and object-level ownership (the order's userId must equal the token's sub).",
    secrets: "Cognito app clients used by browsers/mobile are public clients (no secret, use PKCE); server-side confidential clients keep the client secret in Secrets Manager. Never embed IdP secrets in front-end bundles.",
    leastPrivilege: "Issue narrowly scoped access tokens (resource server scopes such as orders/read) and short expirations (minutes to an hour); keep admin operations behind a separate group and audit trail."
  },
  iam: [
    "Cognito administration: cognito-idp:CreateUserPool, cognito-idp:CreateUserPoolClient, cognito-idp:UpdateUserPool, cognito-idp:AdminAddUserToGroup for the platform team or pipeline.",
    "API Gateway → Lambda authorizer: a resource-based policy on the authorizer function allowing apigateway.amazonaws.com to invoke it (added automatically in the console) and an execution role with CloudWatch Logs permissions.",
    "Backend admin actions on users (e.g. an admin API that lists or disables shoppers): the ECS task role or Lambda role needs cognito-idp:AdminGetUser / AdminDisableUser on the user pool ARN.",
    "Cognito Lambda triggers (pre-sign-up, post-confirmation) need lambda:InvokeFunction granted to cognito-idp.amazonaws.com via the function's resource policy.",
    "Identity pools (only if browsers call AWS directly): an authenticated role trusted by cognito-identity.amazonaws.com with permissions scoped using ${cognito-identity.amazonaws.com:sub} in resource paths."
  ],
  scaling: [
    "Cognito user pools are managed and scale to millions of users; request-rate quotas apply per category (e.g. sign-in calls) and can be raised.",
    "API Gateway authorizers scale with the API; JWT authorizers add negligible latency, while Lambda authorizers add an invocation — cache their results (authorizer result TTL) to reduce cost and latency.",
    "Stateless JWT validation in ECS needs no session store; scaling out tasks does not multiply auth load beyond one JWKS fetch per task.",
    "The ALB authentication action keeps session state in a signed cookie, so no server-side session store is required across tasks.",
    "Keep authorization data (roles/groups) in the token to avoid a database lookup on every request; refresh the token when roles change."
  ],
  availability: [
    "Cognito is a regional multi-AZ managed service; a regional outage of the IdP blocks new sign-ins but tokens already issued remain valid until expiry.",
    "JWKS caching in the application lets token verification continue during short IdP unavailability; use a reasonable cache TTL and handle key rotation by refetching on unknown kid.",
    "API Gateway and the ALB are regional, multi-AZ; authorizer failures return 401/403 or 500 depending on cause — monitor the 4xx/5xx split.",
    "Cognito user pools cannot be replicated across Regions; for multi-Region DR plan for user export/import or an external IdP with global availability.",
    "Design graceful degradation: public catalogue pages keep working without auth; only personalized/checkout flows depend on the IdP."
  ],
  cost: [
    "Cognito user pools are priced per monthly active user (MAU) with a free tier; advanced security features and SAML/OIDC federated users are priced differently — check current pricing.",
    "API Gateway charges per request regardless of authorizer; a Lambda authorizer adds Lambda invocations unless results are cached.",
    "The ALB authentication action is included in ALB pricing (LCU-based).",
    "SMS MFA incurs per-message Amazon SNS charges; TOTP MFA is free.",
    "NAT Gateway data processing for JWKS fetches is negligible if the keys are cached."
  ],
  commonMistakes: [
    "Confusing IAM with user auth: creating IAM users for customers or trying to protect a public API with IAM authorization for browsers.",
    "Checking only that a JWT parses, without verifying signature, issuer (iss), audience/client_id, expiry (exp), and token_use — anyone can mint an unsigned token.",
    "Using the ID token as an API bearer token when the API expects an access token with scopes (or vice versa).",
    "Authenticating but never authorizing: any logged-in user can fetch /orders/{id} for someone else's order (broken object-level authorization).",
    "Storing refresh tokens in localStorage where XSS can steal them; use HttpOnly Secure cookies or a backend-for-frontend.",
    "Fetching the JWKS on every request (rate limits, latency) or caching it forever (breaks on key rotation).",
    "Skipping the authorizer on 'internal' routes that are still reachable through the public API Gateway or ALB."
  ],
  bestPractices: [
    "Use Cognito (or an established IdP) with the hosted UI / Authorization Code flow with PKCE for browsers and mobile; never the implicit flow.",
    "Validate tokens at the edge (API Gateway JWT authorizer or ALB OIDC) and again in the application for defence in depth.",
    "Put roles/groups in token claims (cognito:groups or a custom claim) and enforce RBAC plus object ownership in code.",
    "Short access-token lifetimes (5–60 minutes) with refresh tokens; revoke by disabling the user or using Cognito token revocation.",
    "Separate app clients per front end (web, mobile, admin) with only the OAuth flows and scopes each needs.",
    "Enable MFA (at least optional TOTP) and Cognito advanced security for admin users, and log authentication events and authorization denials (403) to CloudWatch with alerts on unusual spikes.",
    "Reserve IAM/SigV4 for service-to-service calls and Cognito identity pools only when the browser truly needs direct AWS access."
  ],
  creationSteps: [
    "Open the AWS Console and go to Amazon Cognito → User pools → Create user pool.",
    "Choose the sign-in options (Email as a username attribute), set the password policy, and choose MFA (Optional with Authenticator apps recommended).",
    "Configure sign-up: required attributes (email), email verification via Cognito's default email sender (switch to Amazon SES for production volume).",
    "Name the pool shop-users, select 'Use the Cognito Hosted UI', and enter a Cognito domain prefix such as shop-auth-prod.",
    "Create the initial app client: type 'Public client' (no client secret), name shop-web, allowed callback URL https://shop.example.com/callback, sign-out URL, OAuth grant 'Authorization code grant', scopes openid, email, profile.",
    "Click Create user pool and copy the User pool ID (e.g. eu-west-1_AbCdEfGhI) and the app client ID.",
    "Optionally go to Groups → Create group 'admins' for staff; group membership appears in the cognito:groups claim.",
    "Open API Gateway → APIs → your HTTP API → Authorization → Manage authorizers → Create: type JWT, name cognito-jwt, Identity source $request.header.Authorization, Issuer URL https://cognito-idp.<region>.amazonaws.com/<UserPoolId>, Audience = the app client ID.",
    "Under Authorization → Routes, attach the cognito-jwt authorizer to every protected route (e.g. GET /orders, POST /checkout); leave GET /products unauthenticated.",
    "Deploy the API (auto-deploy on $default stage) and test: call GET /orders without a token (expect 401), then with the access token from a hosted-UI sign-in (expect 200).",
    "In the Lambda handler read event.requestContext.authorizer.jwt.claims (sub, cognito:groups) and enforce ownership/RBAC before returning data.",
    "For the ALB path, add an 'Authenticate (Cognito)' action to the HTTPS listener rule ahead of the forward action, selecting the user pool, domain, and app client; then read x-amzn-oidc-data in the ECS application."
  ],
  productionRecommendations: [
    "Authorization Code + PKCE for public clients; client secrets only for server-side confidential clients.",
    "JWT/Cognito authorizer on every non-public route; explicit allow-list of unauthenticated routes.",
    "Application-level ownership and RBAC checks in addition to the edge authorizer.",
    "Custom domain with ACM certificate for the hosted UI; Amazon SES for verification emails.",
    "MFA and advanced security for admin group; CloudWatch alarms on 401/403 spikes and sign-in failures.",
    "Document clearly: end users → Cognito/JWT; services → IAM roles/SigV4."
  ],
  configExample: {
    title: "Express middleware — verify a Cognito access token (aws-jwt-verify)",
    lang: "text",
    code: `// npm i aws-jwt-verify   (Node.js / Express running in ECS Fargate)
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID,  // e.g. eu-west-1_AbCdEfGhI
  clientId:   process.env.APP_CLIENT_ID, // shop-web app client
  tokenUse:   "access",                  // reject ID tokens used as bearer tokens
});                                       // JWKS is fetched once and cached
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing token" });      // AuthN failed
  try {
    req.user = await verifier.verify(token);  // checks signature, iss, client_id, exp, token_use
    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid token" });
  }
}
function requireGroup(group) {                                               // AuthZ: RBAC
  return (req, res, next) =>
    (req.user["cognito:groups"] || []).includes(group) ? next() : res.status(403).end();
}
app.get("/orders/:id", requireAuth, async (req, res) => {
  const order = await db.getOrder(req.params.id);
  if (!order || order.userId !== req.user.sub) return res.status(403).end(); // object ownership
  res.json(order);
});
app.post("/refunds", requireAuth, requireGroup("admins"), refundHandler);`
  },
  productionChecklist: [
    "Cognito user pool (or IdP) configured with Authorization Code + PKCE; implicit flow disabled.",
    "Every non-public API route has a JWT/Cognito/Lambda authorizer or ALB authentication action.",
    "Backend verifies signature, iss, aud/client_id, exp, and token_use; JWKS cached with rotation handling.",
    "Object-level authorization enforced (users can access only their own orders).",
    "Admin operations gated by group/role claims with separate app client and MFA.",
    "Refresh tokens stored securely; access token lifetime ≤ 1 hour.",
    "Custom domain + ACM certificate for hosted UI and API; SES configured for emails.",
    "CloudWatch alarms on authentication failures and 401/403 spikes.",
    "Service-to-service calls use IAM roles/SigV4, not user tokens.",
    "Sign-in and admin actions are logged for audit."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Roles for Lambda authorizers/handlers and permissions to manage Cognito; IAM handles service-to-service auth alongside this layer." },
    { id: "api-gateway", kind: "recommended", why: "JWT/Cognito/Lambda authorizers validate tokens for the serverless path." },
    { id: "alb", kind: "alternative", why: "The ALB OIDC/Cognito authentication action validates users for the container path instead of API Gateway." },
    { id: "lambda", kind: "optional", why: "Custom Lambda authorizers and Cognito triggers implement bespoke logic." },
    { id: "ecs", kind: "optional", why: "ECS services verify JWTs in middleware and apply RBAC." },
    { id: "cloudfront", kind: "optional", why: "Fronts the hosted UI/API with a custom domain and can add WAF." },
    { id: "cloudwatch", kind: "recommended", why: "Logs and alarms for authentication failures and authorization denials." }
  ],
  related: ["iam", "api-gateway", "alb", "lambda", "cloudfront"],
  ecommerceRole: "Shoppers sign in with Cognito and receive JWTs; API Gateway (serverless path) or the ALB/Express middleware (container path) verify each request and the application enforces that a user sees only their own cart and orders while staff in the admins group can process refunds. IAM roles, not user tokens, authorize the worker → SQS → RDS and Lambda → DynamoDB hops.",
  failure: {
    title: "Token validation / identity provider fails",
    whatHappens: "If Cognito (or the IdP) is unavailable, new sign-ins and token refreshes fail, so users with expired tokens are logged out while users with valid tokens continue until expiry. If the JWKS cannot be fetched and the application has no cached keys, every request is rejected with 401 even though users are legitimate. A misconfigured authorizer (wrong issuer or audience) rejects 100% of requests with 401; a missing authorizer on a route silently accepts everyone. Bugs in authorization logic produce the worst failure: valid users reading or modifying other users' orders, with no error anywhere.",
    awsMechanisms: [
      "API Gateway access logs and CloudWatch metrics (4XXError, 5XXError, IntegrationLatency) show authorizer rejections.",
      "Cognito emits CloudWatch metrics and, with advanced security, risk events and logs for sign-in attempts.",
      "Authorizer result caching (Lambda authorizers) and application-side JWKS caching allow validation to continue during brief IdP issues.",
      "Cognito Hosted UI, tokens, and refresh flows are regional multi-AZ services managed by AWS."
    ],
    mitigations: [
      "Cache JWKS with a TTL and refetch on unknown key IDs; fail closed (401) rather than open if signature verification is impossible.",
      "Alarm on sudden 401/403 spikes and on Cognito sign-in failure metrics; run a canary that signs in and calls a protected route.",
      "Automated tests for object-level authorization (user A requesting user B's order must get 403) in CI.",
      "Keep public catalogue pages independent of auth so the storefront degrades gracefully; give tokens reasonable lifetimes to bridge short IdP outages."
    ]
  },
  beginnerConnectionHint: "The shopper's browser talks to Cognito to log in and gets a ticket (token); it then shows that ticket to API Gateway or the ALB on every request, and the Lambda or ECS code reads the ticket to decide what the shopper may see."
},
{
  id: "nacl",
  name: "Network ACLs",
  shortName: "NACL",
  fullName: "Amazon VPC Network Access Control Lists",
  category: "identity",
  icon: "🚧",
  tagline: "Stateless subnet-level firewall with numbered allow/deny rules — a second line of defence",
  whatIsIt: "A Network ACL is an optional stateless firewall applied at the subnet boundary of a VPC. It holds numbered inbound and outbound rules that ALLOW or DENY traffic by protocol, port range, and CIDR, evaluated in ascending rule-number order until the first match. Every subnet is associated with exactly one NACL, and the default NACL allows all traffic in both directions.",
  eli5: "If a security group is a bouncer at each room's door, a NACL is the guard at the gate of the whole street. The guard has a numbered checklist: rule 100 says 'let the delivery vans in', rule 110 says 'never let the grumpy neighbour in'. The guard is forgetful, though — when someone leaves the street, they must also be on the outgoing list, or they get stuck at the gate.",
  technical: "NACLs are evaluated in the VPC data plane for traffic entering or leaving a subnet (not for traffic between ENIs within the same subnet). They are stateless: no connection tracking, so a response to an allowed inbound request must be explicitly permitted by an outbound rule on the ephemeral port range the client uses (commonly 1024–65535; for example Linux clients often use 32768–60999 and NAT Gateways use 1024–65535). Rules are numbered 1–32766, processed lowest-first, with a final non-editable '*' deny rule. A NACL can be associated with many subnets but a subnet has exactly one NACL. Default quotas are 20 inbound and 20 outbound rules per NACL.",
  whyUse: [
    "You need an explicit DENY — for example blocking a known malicious CIDR or preventing the DB subnets from ever talking to the internet — which security groups cannot express.",
    "A subnet-level guardrail applies to every resource in the subnet regardless of which security group someone attached, guarding against SG mistakes.",
    "Compliance frameworks often require a documented network boundary per tier; NACLs make the DB tier's allowed sources visible in one place.",
    "They provide defence in depth: even if an attacker alters a security group, the NACL still constrains subnet ingress/egress.",
    "They are free and evaluated at line rate; the only cost is operational care."
  ],
  whenToUse: [
    "Private DB subnets: allow inbound 5432 only from the app subnet CIDRs (10.0.11.0/24, 10.0.12.0/24) and deny everything else.",
    "Blocking a specific abusive IP range at the public subnet edge quickly while a WAF rule is prepared.",
    "Preventing lateral movement between tiers (e.g. deny app subnets from reaching a management subnet).",
    "Environments with strict audit requirements for subnet-level allow-lists.",
    "Temporary isolation of a subnet during an incident by swapping in a restrictive NACL."
  ],
  whenNotToUse: [
    "Fine-grained per-resource rules (this task may reach that database): use security groups, which are stateful and can reference other SGs.",
    "Filtering within a subnet (two ECS tasks in 10.0.11.0/24 talking to each other): NACLs do not apply to intra-subnet traffic; use security groups.",
    "HTTP-layer protection (SQL injection, bots, rate limiting): use AWS WAF on the ALB/CloudFront/API Gateway.",
    "Protecting regional services like S3 or DynamoDB: they have no subnet; use IAM, bucket policies, and VPC endpoint policies.",
    "Replacing security groups entirely: NACLs have small rule quotas and stateless semantics that make them poor primary firewalls."
  ],
  placement: {
    scope: "vpc-edge",
    subnet: "any",
    internetAccessible: false,
    summary: "A NACL is a VPC component associated with subnets. In the reference architecture you would typically have three NACLs: public-nacl (public subnets), app-nacl (private app subnets), and db-nacl (private DB subnets), each covering both AZs' subnets of that tier.",
    securityGroup: "Not applicable to the NACL itself; NACLs and security groups are independent layers and BOTH must allow a flow. Security groups filter at the ENI (stateful); NACLs filter at the subnet edge (stateless).",
    nacl: "This IS the NACL layer. Rules are numbered and evaluated lowest-first; the first match decides; the implicit final rule denies. Each subnet has exactly one NACL; the default NACL allows all.",
    routeTable: "Independent. The route table decides where a packet goes next; the NACL decides whether it may cross the subnet boundary at all. A packet can be routed correctly and still be dropped by a NACL.",
    nat: "Traffic from private subnets to the NAT Gateway (in a public subnet) crosses two NACLs: outbound on the app subnet and inbound on the public subnet, plus the return path. Both public and app NACLs need the corresponding ephemeral-port rules.",
    igw: "Traffic to/from the IGW passes the public subnet NACL. Public NACLs must allow inbound 443/80 from 0.0.0.0/0 and outbound ephemeral 1024–65535 to 0.0.0.0/0 for responses to internet clients."
  },
  dataFlow: {
    in: [
      "Packets entering the subnet (from the IGW, NAT Gateway, other subnets, peering, or VPN) are checked against inbound rules in numbered order.",
      "Response packets returning to a client in the subnet also count as inbound and need an explicit rule on the client's ephemeral ports.",
      "Rule edits (create/replace network ACL entry) from console, CLI, or IaC take effect immediately."
    ],
    out: [
      "Packets leaving the subnet are checked against outbound rules in numbered order.",
      "Response packets from servers in the subnet to clients elsewhere need an outbound rule on the clients' ephemeral ports.",
      "Denied packets are dropped silently; VPC Flow Logs record REJECT entries useful for spotting a missing rule."
    ]
  },
  networking: [
    "Because NACLs are stateless, pair every service rule with an ephemeral-port rule for the reverse direction (e.g. inbound 5432 from app CIDRs and outbound 1024–65535 to app CIDRs on the DB subnet).",
    "NACLs do not filter traffic between resources in the same subnet, nor traffic to the instance metadata service, DHCP, or Route 53 Resolver at the VPC+2 address.",
    "Gateway endpoint traffic (S3/DynamoDB) uses public AWS IP ranges; a NACL restricting outbound to VPC CIDRs will break these unless the AWS managed prefix list CIDRs are allowed.",
    "Rule numbers should leave gaps (100, 110, 120…) so rules can be inserted later; the first matching rule wins, so put specific denies before broad allows.",
    "Keep the app-nacl permissive enough for NAT egress (outbound 443 to 0.0.0.0/0, inbound 1024–65535 from 0.0.0.0/0) or tasks cannot reach ECR, Secrets Manager, and CloudWatch."
  ],
  security: {
    iam: "IAM permissions ec2:CreateNetworkAcl, ec2:CreateNetworkAclEntry, ec2:ReplaceNetworkAclEntry, ec2:DeleteNetworkAclEntry, ec2:ReplaceNetworkAclAssociation control who may change subnet firewalls; restrict them to network administrators and the IaC pipeline.",
    securityGroups: "Both layers must allow the flow. Use SGs as the primary, precise control and NACLs as coarse subnet guardrails with explicit denies.",
    nacl: "Ordered allow/deny lists per subnet; explicit deny rules for known-bad CIDRs; tiered allow-lists (public → app → db) using subnet CIDRs.",
    encryption: "Not applicable — NACLs inspect only L3/L4 headers and never see or affect payload encryption.",
    authentication: "None; NACLs match on IP addresses, protocols, and ports only.",
    authorization: "Rule evaluation is the authorization: first matching numbered rule allows or denies the packet; unmatched packets hit the final '*' deny.",
    secrets: "Not applicable — no credentials are involved.",
    leastPrivilege: "For the DB tier, allow only the engine port from the app subnet CIDRs plus the ephemeral return range, and deny all else; for public subnets, allow only the listener ports and the ephemeral range."
  },
  iam: [
    "Network administrators / IaC role: ec2:CreateNetworkAcl, ec2:DeleteNetworkAcl, ec2:CreateNetworkAclEntry, ec2:ReplaceNetworkAclEntry, ec2:DeleteNetworkAclEntry, ec2:ReplaceNetworkAclAssociation, ec2:CreateTags on the shop VPC.",
    "Read-only for developers: ec2:DescribeNetworkAcls to troubleshoot blocked traffic.",
    "Deny ec2:*NetworkAcl* actions to application roles and most humans via SCP or permissions boundary; NACL changes affect whole tiers.",
    "AWS Config (optional) requires its service role to record NACL changes and evaluate rules such as unrestricted inbound checks.",
    "VPC Flow Logs delivery role (or S3 bucket policy) to publish REJECT records used to diagnose NACL drops."
  ],
  scaling: [
    "NACLs are evaluated in the VPC data plane with no throughput limit you manage.",
    "Default quota of 20 inbound and 20 outbound rules per NACL (adjustable up to 40) means rules must stay coarse — subnet CIDRs and tier ports, not individual hosts.",
    "One NACL can be associated with many subnets, so a tier's two AZ subnets share one NACL; adding a third AZ just needs a new association.",
    "As the number of tiers grows, keep a small, standard set of NACLs (public, app, db) rather than one per subnet.",
    "Use larger CIDR summaries (e.g. 10.0.0.0/16 for intra-VPC allows) to save rule slots where fine-grained control is not required."
  ],
  availability: [
    "NACLs are VPC-level constructs with no single point of failure; they exist in every AZ where their subnets are.",
    "Rule changes apply immediately to all associated subnets in all AZs.",
    "A wrong rule is a multi-AZ outage instantly (for example forgetting the ephemeral range blocks all responses in the tier) — change via IaC with review and test in staging.",
    "Keep the default NACL untouched (allow all) as a known-good fallback you can re-associate during an incident.",
    "Document each NACL's purpose; during incidents, the stateless behaviour is a frequent source of confusion."
  ],
  cost: [
    "Network ACLs are free — no charge for creation, rules, or evaluation.",
    "VPC Flow Logs used to diagnose NACL rejects are billed for log ingestion/storage.",
    "AWS Config recording of NACL configuration changes is billed per configuration item.",
    "Indirect cost: outages caused by missing ephemeral rules and engineering time debugging stateless behaviour."
  ],
  commonMistakes: [
    "Allowing inbound 443 but forgetting the outbound ephemeral-port rule (1024–65535), so the ALB accepts SYNs but responses are dropped and clients hang.",
    "Restricting the app subnet's inbound rules to VPC CIDRs only, which blocks return traffic from the NAT Gateway's internet fetches (ECR, Secrets Manager, package downloads).",
    "Numbering rules without gaps, then being unable to insert a deny before an allow.",
    "Placing a broad allow (rule 100: allow all) before a specific deny (rule 200), so the deny never matches.",
    "Expecting the NACL to filter traffic between two tasks in the same subnet — it does not.",
    "Blocking AWS service IP ranges used by gateway endpoints (S3/DynamoDB) or by Route 53 Resolver, causing mysterious DNS or S3 failures.",
    "Editing the default NACL instead of creating custom ones, so new subnets inherit restrictive rules unexpectedly."
  ],
  bestPractices: [
    "Leave the default NACL as allow-all; create explicit public-nacl, app-nacl, and db-nacl and associate them deliberately.",
    "For every allow rule on a service port, add the matching ephemeral 1024–65535 rule in the opposite direction.",
    "Use rule number gaps (100, 110, 120…) and put specific denies below broad allows in number (i.e. lower numbers).",
    "Keep NACL rules coarse (tier CIDRs, service ports) and do fine-grained control in security groups.",
    "Define NACLs in Terraform/CloudFormation with review; test changes in staging and watch VPC Flow Logs for new REJECTs.",
    "Use NACL deny rules as the quick response for blocking hostile CIDRs, then move to AWS WAF for HTTP-layer protection.",
    "Record NACL changes with AWS Config and CloudTrail; alert on ReplaceNetworkAclAssociation events in production."
  ],
  creationSteps: [
    "Open the AWS Console and go to VPC → Security → Network ACLs → Create network ACL.",
    "Name it db-nacl, choose the shop VPC (10.0.0.0/16), and click Create.",
    "Select db-nacl → Inbound rules → Edit inbound rules. Add rule 100: PostgreSQL (5432), source 10.0.11.0/24, Allow; rule 110: 5432 from 10.0.12.0/24, Allow. Save.",
    "Edit outbound rules. Add rule 100: Custom TCP 1024–65535 to 10.0.11.0/24, Allow; rule 110: TCP 1024–65535 to 10.0.12.0/24, Allow (return traffic to app tasks). Save.",
    "Go to Subnet associations → Edit and associate db-nacl with the two DB subnets (10.0.21.0/24, 10.0.22.0/24).",
    "Create app-nacl: inbound rule 100 allow TCP 8080 from 10.0.1.0/24 and 10.0.2.0/24 (ALB in public subnets) as two rules, rule 120 allow TCP 1024–65535 from 0.0.0.0/0 (responses from NAT/internet and RDS), outbound rule 100 allow TCP 443 to 0.0.0.0/0, rule 110 allow TCP 5432 to 10.0.21.0/24 and 10.0.22.0/24, rule 130 allow TCP 1024–65535 to 10.0.1.0/24 and 10.0.2.0/24 (responses to the ALB). Associate with the app subnets.",
    "Create public-nacl: inbound rules allow TCP 443 and 80 from 0.0.0.0/0 plus TCP 1024–65535 from 0.0.0.0/0 (NAT return traffic), outbound rules allow TCP 1024–65535 to 0.0.0.0/0 (responses to internet clients), TCP 443/80 to 0.0.0.0/0 (NAT egress), and TCP 8080 to the app subnet CIDRs. Associate with the public subnets.",
    "Optionally add a deny rule with a low number (e.g. rule 50: Deny all traffic from 203.0.113.0/24) to public-nacl to block a hostile range.",
    "Enable VPC Flow Logs on the VPC and generate test traffic: browse the ALB, run a DB query from an ECS task, pull an image; check for REJECT entries.",
    "Fix any REJECTs by adding the missing rule (usually an ephemeral range), then commit the final rule set to Terraform."
  ],
  productionRecommendations: [
    "Custom NACLs per tier (public, app, db); default NACL kept allow-all and unused.",
    "Every service-port allow paired with an ephemeral 1024–65535 rule in the reverse direction.",
    "Rule numbers with gaps; specific denies numbered lower than broad allows.",
    "DB subnets: inbound only engine port from app CIDRs; no outbound beyond ephemeral to app CIDRs.",
    "Changes only through IaC with staging validation and Flow Logs review.",
    "Config/CloudTrail alerts on NACL association or entry changes in production."
  ],
  configExample: {
    title: "Terraform — DB-tier NACL with numbered rules and ephemeral return ports",
    lang: "hcl",
    code: `resource "aws_network_acl" "db" {
  vpc_id     = aws_vpc.shop.id                                 # 10.0.0.0/16
  subnet_ids = [aws_subnet.db_a.id, aws_subnet.db_b.id]        # 10.0.21.0/24, 10.0.22.0/24
  tags       = { Name = "db-nacl" }
}

# Inbound: PostgreSQL from the two private app subnets only
resource "aws_network_acl_rule" "db_in_app_a" {
  network_acl_id = aws_network_acl.db.id
  rule_number = 100; egress = false; protocol = "tcp"; rule_action = "allow"
  cidr_block  = "10.0.11.0/24"; from_port = 5432; to_port = 5432
}
resource "aws_network_acl_rule" "db_in_app_b" {
  network_acl_id = aws_network_acl.db.id
  rule_number = 110; egress = false; protocol = "tcp"; rule_action = "allow"
  cidr_block  = "10.0.12.0/24"; from_port = 5432; to_port = 5432
}

# Outbound: replies go back to the tasks' ephemeral ports (NACLs are stateless!)
resource "aws_network_acl_rule" "db_out_app_a" {
  network_acl_id = aws_network_acl.db.id
  rule_number = 100; egress = true; protocol = "tcp"; rule_action = "allow"
  cidr_block  = "10.0.11.0/24"; from_port = 1024; to_port = 65535
}
resource "aws_network_acl_rule" "db_out_app_b" {
  network_acl_id = aws_network_acl.db.id
  rule_number = 110; egress = true; protocol = "tcp"; rule_action = "allow"
  cidr_block  = "10.0.12.0/24"; from_port = 1024; to_port = 65535
}
# Everything else hits the implicit final "*" DENY rule.`
  },
  productionChecklist: [
    "Each tier's subnets are associated with a purpose-built NACL; default NACL unused.",
    "Every inbound service rule has a matching outbound ephemeral (1024–65535) rule and vice versa.",
    "DB NACL allows the engine port only from app subnet CIDRs.",
    "App NACL allows NAT/endpoint egress (443) and inbound ephemeral for responses.",
    "Public NACL allows 443/80 inbound and ephemeral outbound; NAT return traffic accounted for.",
    "Rule numbers have gaps; explicit denies are numbered lower than the allows they must precede.",
    "NACLs are defined in IaC; console edits blocked or alerted in production.",
    "VPC Flow Logs enabled and checked for unexpected REJECTs after each change.",
    "Team runbook explains stateless behaviour and the emergency fallback to the default NACL."
  ],
  dependencies: [
    { id: "vpc", kind: "required", why: "NACLs are created inside a VPC." },
    { id: "subnets", kind: "required", why: "A NACL only does anything when associated with subnets; each subnet has exactly one." },
    { id: "cidr", kind: "required", why: "Rules are expressed in CIDR ranges of tiers and external networks." },
    { id: "iam", kind: "required", why: "Permissions to create and modify NACL entries and associations." },
    { id: "security-groups", kind: "alternative", why: "The primary, stateful, resource-level firewall; NACLs complement rather than replace them." },
    { id: "nat-gateway", kind: "recommended", why: "Private subnet NACLs must permit egress to and return traffic from the NAT Gateway." },
    { id: "cloudwatch", kind: "optional", why: "VPC Flow Logs in CloudWatch Logs reveal NACL REJECTs." }
  ],
  related: ["security-groups", "subnets", "vpc", "cidr", "route-tables"],
  ecommerceRole: "NACLs add a subnet-level guardrail: the DB subnets accept 5432 only from the app subnets, the app subnets accept traffic only from the ALB subnets and NAT return flows, and the public subnets accept only web ports — so even a mistaken security group cannot expose the database.",
  failure: {
    title: "NACL blocks legitimate traffic (e.g., missing ephemeral port rule)",
    whatHappens: "Because NACLs are stateless, the classic failure is allowing the request direction but not the reply: the ALB or RDS accepts the connection (SYN arrives) but its SYN-ACK is dropped on the way out, so clients see connection timeouts rather than refusals — ALB targets go unhealthy, ECS tasks cannot reach RDS, or NAT egress for ECR pulls stalls. Since a NACL covers whole subnets in both AZs, the outage hits an entire tier at once, immediately after the rule change. A wrongly ordered deny (numbered after a broad allow) has the opposite failure: it silently never applies.",
    awsMechanisms: [
      "VPC Flow Logs record REJECT for dropped packets including the direction, which pinpoints a missing ephemeral rule.",
      "VPC Reachability Analyzer identifies the exact NACL rule blocking a source→destination path.",
      "Rule changes are immediate, so fixes take effect as soon as the entry is added; the default NACL can be re-associated as a fallback.",
      "AWS Config records configuration history of NACL entries and associations for rollback and audit."
    ],
    mitigations: [
      "Always pair service-port rules with ephemeral 1024–65535 rules in the reverse direction; encode this in a Terraform module.",
      "Test NACL changes in staging and monitor ALB UnHealthyHostCount, RDS connection errors, and Flow Log REJECT counts right after applying.",
      "Keep rule number gaps and review order so denies precede allows where intended.",
      "Alert on NACL association/entry changes in production and keep a one-step rollback (previous IaC state or default NACL)."
    ]
  },
  beginnerConnectionHint: "A NACL stands at the edge of each subnet and checks every packet going in or out against a numbered list — remembering nothing — so it works alongside the security groups on the ALB, ECS tasks, and RDS, not instead of them."
});
