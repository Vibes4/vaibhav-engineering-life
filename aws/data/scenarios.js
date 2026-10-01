/* Failure scenarios. `failNodes` are canvas instance ids to mark as failed; `survivors` are
   highlighted as the path that keeps working. `service` pulls the detailed text from that
   service's `failure` field; `extra` adds scenario-specific text. */
window.AWS_SCENARIOS = [
  { id: "ec2", title: "EC2 instance fails", service: "ec2", failNodes: ["ec2-a"], survivors: ["alb", "ec2-b", "ecs-a", "ecs-b"] },
  { id: "ecs-task", title: "ECS task fails", service: "ecs", failNodes: ["ecs-a"], survivors: ["alb", "ecs-b", "rds-primary"] },
  { id: "az", title: "Availability Zone A fails", service: null,
    failNodes: ["nat-a", "ecs-a", "ec2-a", "worker-a", "lambda-eni-a", "rds-primary"], survivors: ["alb", "nat-b", "ecs-b", "worker-b", "rds-standby", "cloudfront"],
    custom: {
      whatHappens: "Everything in AZ-A becomes unreachable at once: the ALB node, NAT Gateway, ECS tasks, and the RDS primary. Because the architecture is duplicated in AZ-B, the platform degrades instead of failing: the ALB's DNS stops returning the AZ-A node and its health checks fail the AZ-A targets, so all traffic flows to AZ-B tasks. RDS Multi-AZ promotes the standby in AZ-B (1–2 minutes of connection errors while the DNS endpoint flips). Auto Scaling launches replacement tasks in AZ-B to restore the desired count. Private subnets in AZ-B keep outbound access through their own NAT Gateway.",
      awsMechanisms: ["ALB is Multi-AZ by design: each AZ has its own load-balancer nodes and DNS entries; unhealthy targets are removed within the health-check interval.", "RDS Multi-AZ synchronous standby with automatic failover.", "ECS service scheduler + Application Auto Scaling replace lost tasks in the remaining AZ.", "Per-AZ NAT Gateways and per-AZ private route tables mean AZ-B does not depend on AZ-A's NAT.", "Regional services (S3, DynamoDB, SQS, SNS, EventBridge, Lambda, CloudWatch) already replicate across at least three AZs."],
      mitigations: ["Run min 2 tasks/instances spread across AZs and size each AZ to carry 100% of traffic (n+1).", "Never share a single NAT Gateway across AZs.", "Use the RDS DNS endpoint and reconnect logic; consider RDS Proxy.", "Test by draining an AZ (ECS task placement constraints or ASG AZ rebalancing) in a game day."]
    } },
  { id: "rds", title: "RDS primary fails", service: "rds", failNodes: ["rds-primary"], survivors: ["rds-standby", "ecs-a", "ecs-b"] },
  { id: "nat", title: "NAT Gateway fails", service: "nat-gateway", failNodes: ["nat-a"], survivors: ["nat-b", "ecs-b", "igw"] },
  { id: "alb", title: "ALB fails or a target becomes unhealthy", service: "alb", failNodes: ["alb"], survivors: ["cloudfront", "ecs-a", "ecs-b"] },
  { id: "sqs-consumer", title: "SQS consumer fails", service: "sqs", failNodes: ["worker-a"], survivors: ["sqs", "worker-b"] },
  { id: "lambda", title: "Lambda fails", service: "lambda", failNodes: ["lambda"], survivors: ["eventbridge", "sqs", "api-gateway"] },
  { id: "s3", title: "S3 becomes unavailable", service: "s3", failNodes: ["s3"], survivors: ["cloudfront", "ecs-a", "ecs-b"] },
  { id: "eventbridge", title: "An EventBridge target fails", service: "eventbridge", failNodes: ["step-functions"], survivors: ["eventbridge", "sqs"] },
  { id: "ecr", title: "ECR unavailable during a deploy", service: "ecr", failNodes: ["ecr"], survivors: ["ecs-a", "ecs-b"] }
];
