# AWS Service node schema (used by aws/panel.js)

Every file under aws/data/services/ must be plain browser JS (no imports/exports) that does:

    window.AWS_SERVICES = window.AWS_SERVICES || [];
    window.AWS_SERVICES.push({ ...service }, { ...service });

Fields (ALL required unless marked optional). Strings are plain text (no HTML) unless noted.

  id              string  — canonical id (see list below). MUST match exactly.
  name            string  — official name, e.g. "Amazon RDS"
  shortName       string  — label on the diagram, e.g. "RDS"
  fullName        string  — e.g. "Amazon Relational Database Service"
  category        string  — one of: compute | containers | identity | networking | integration | scaling | database | storage | monitoring
  icon            string  — a single emoji used as the service glyph
  tagline         string  — <= 90 chars, one-line summary shown under the title
  whatIsIt        string  — 2–3 sentence neutral definition ("What is it?")
  eli5            string  — "Explain like I'm 5" — 2–4 sentences, an analogy a child could follow, NO jargon
  technical       string  — 2–4 sentence precise technical explanation (layers, protocols, AWS terms)
  whyUse          string[] — the actual problems it solves (3–5 bullets)
  whenToUse       string[] — practical scenarios (3–5)
  whenNotToUse    string[] — misuse + alternatives, each bullet names the alternative (3–5)
  placement {
    scope         string  — one of: "vpc" (lives inside your VPC subnets) | "vpc-edge" (VPC component itself e.g. IGW, NAT, route tables) |
                            "regional" (AWS-managed regional service outside your VPC, reached via public endpoint / VPC endpoint) |
                            "global" (IAM, CloudFront) | "concept" (CIDR, Authorization — not a deployable resource)
    subnet        string  — one of: "public" | "private-app" | "private-db" | "any" | "n/a"
    internetAccessible boolean — is it reachable from the public internet in the reference architecture
    summary       string  — 1–2 sentences: where it lives and why
    securityGroup string  — how SGs apply (or "Not applicable — ..." with the reason)
    nacl          string  — how NACLs apply
    routeTable    string  — which route table / routes matter
    nat           string  — whether it needs a NAT gateway and why
    igw           string  — whether it needs an Internet Gateway and why
    vpcOptional   string  — (optional) for services that CAN attach to a VPC (Lambda, API Gateway private, VPC endpoints) explain the option
  }
  dataFlow {
    in            string[] — what data enters the service (2–4)
    out           string[] — what data leaves the service (2–4)
  }
  networking      string[] — networking requirements (3–5 bullets, e.g. ports, DNS, endpoints)
  security        { iam, securityGroups, nacl, encryption, authentication, authorization, secrets, leastPrivilege } — each a 1–2 sentence string
  iam             string[] — concrete IAM requirements: which roles/policies the service needs and which principals need permissions on it (3–5)
  scaling         string[] — how it scales (3–5)
  availability    string[] — Multi-AZ, replication, failover, DR (3–5)
  cost            string[] — major cost drivers in plain language (3–5)
  commonMistakes  string[] — real mistakes developers make (5–7)
  bestPractices   string[] — production best practices (5–7)
  creationSteps   string[] — ordered AWS Console steps, 6–12 steps, imperative voice ("Open the RDS console.")
  productionRecommendations string[] — 4–6 bullets shown right after creation steps
  configExample   { title: string, lang: "json"|"yaml"|"bash"|"hcl"|"text", code: string } — a SHORT realistic snippet (CLI command, Terraform, IAM policy, task def…), <= 30 lines
  productionChecklist string[] — 6–10 checkbox items
  dependencies    [{ id: string, kind: "required"|"recommended"|"optional"|"alternative", why: string }] — ids from the canonical list only
  related         string[] — ids of commonly confused/related services
  ecommerceRole   string  — 1–2 sentences: its job in the reference e-commerce platform
  failure         { title: string, whatHappens: string, awsMechanisms: string[], mitigations: string[] } — "What happens if this fails?" 
  beginnerConnectionHint string — one friendly sentence: who talks to it and who it talks to, in plain words

Canonical ids (use ONLY these in id / dependencies / related):
  ec2, ecs, lambda, ecr, iam, security-groups, authorization, nacl, vpc, cidr, subnets, route-tables,
  igw, nat-gateway, alb, nlb, api-gateway, cloudfront, step-functions, sqs, sns, eventbridge,
  auto-scaling, rds, dynamodb, s3, cloudwatch

Accuracy rules:
  - Do NOT invent AWS features. Use real limits/behaviours only when you are certain; otherwise describe qualitatively.
  - Distinguish required / optional / recommended / alternative clearly (use those words).
  - ALB and API Gateway are ALTERNATIVE entry points, not a chain. ECS and Lambda are alternative compute.
  - Security groups are stateful; NACLs are stateless. NAT Gateway lives in a PUBLIC subnet. RDS Multi-AZ standby is not readable (readable standby only with Multi-AZ DB cluster). Lambda inside a VPC needs NAT (or VPC endpoints) for internet/AWS API access. CloudWatch/S3/DynamoDB/SQS/SNS/EventBridge are regional services outside the VPC reached via public endpoints or VPC endpoints (gateway endpoints for S3/DynamoDB, interface endpoints for the rest).
