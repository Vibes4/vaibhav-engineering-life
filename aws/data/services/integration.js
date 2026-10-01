/* Integration & scaling services — Step Functions, SQS, SNS, EventBridge, Auto Scaling (schema: _schema.md) */
window.AWS_SERVICES = window.AWS_SERVICES || [];
window.AWS_SERVICES.push({
  id: "step-functions",
  name: "AWS Step Functions",
  shortName: "Step Functions",
  fullName: "AWS Step Functions",
  category: "integration",
  icon: "🪜",
  tagline: "Serverless workflow orchestration: chain Lambda, ECS, and AWS APIs into state machines",
  whatIsIt: "AWS Step Functions is a serverless orchestration service that runs workflows defined as state machines in Amazon States Language (JSON). Each state invokes an AWS service (Lambda, ECS, DynamoDB, SQS, SNS, and 200+ AWS SDK integrations), makes a decision, waits, or runs branches in parallel, while Step Functions durably tracks progress, retries failures, and records the execution history.",
  eli5: "Imagine a recipe card with numbered steps: first mix, then bake, then let it cool, then decorate. Step Functions is a patient helper who reads the card, does one step at a time, checks that each step worked, tries again if something spilled, and if the cake is ruined it knows how to clean up the kitchen. You only write the card; the helper remembers exactly where it is, even if a step takes days.",
  technical: "A state machine is a JSON document (Amazon States Language) made of Task, Choice, Parallel, Map, Wait, Pass, Succeed, and Fail states. Task states call AWS services through optimized integrations (lambda:invoke, ecs:runTask.sync, sqs:sendMessage, dynamodb:putItem, sns:publish) or generic AWS SDK integrations, using the Request-Response, Run-a-Job (.sync), or Wait-for-Callback (.waitForTaskToken) patterns. Standard workflows run up to one year with exactly-once execution semantics and durable per-transition history; Express workflows run up to five minutes at very high rate with at-least-once (asynchronous) or at-most-once (synchronous) semantics and write history to CloudWatch Logs.",
  whyUse: [
    "Multi-step business processes such as order fulfillment need coordination, timeouts, retries, and compensation; writing that by hand in Lambda code plus a status table is error-prone.",
    "Every execution has a visual, step-by-step history with input and output per state, which makes debugging and auditing far easier than scattered logs.",
    "Retry and Catch are declared per state with exponential backoff, replacing custom retry loops and try/catch spaghetti.",
    "Long-running waits (for a payment webhook, a human approval, or a three-day timer) cost nothing while waiting because no compute is held.",
    "Direct SDK integrations call DynamoDB, SQS, SNS, ECS, and hundreds of other APIs without writing glue Lambda functions."
  ],
  whenToUse: [
    "The order fulfillment saga: reserve inventory → charge payment → create shipment → notify customer, with compensation (refund, release stock) when a later step fails.",
    "Processes that wait for external systems or people: wait for a payment-provider callback, wait for warehouse confirmation, send a reminder after 3 days.",
    "Fan-out/fan-in over collections with a Map state: process each line item of an order, resize every image of a product upload.",
    "High-volume, short-lived workflows (under 5 minutes) such as event transformation pipelines — use an Express workflow.",
    "Running long jobs and waiting for them to finish: ecs:runTask.sync for a report generation task or a nightly reconciliation."
  ],
  whenNotToUse: [
    "A single step reacting to one event: trigger Lambda directly from EventBridge or SQS; a state machine adds cost and latency for nothing.",
    "Plain decoupling or buffering between a producer and a worker: that is SQS's job; Step Functions orchestrates, it is not a queue.",
    "Streaming millions of records per second: Kinesis Data Streams or Data Firehose with Lambda is the right tool; Standard workflows are billed per state transition.",
    "Latency-critical synchronous request/response inside an API call: call the downstream service directly from ECS or Lambda; a Standard workflow adds start-up and transition latency (Express synchronous can fit short cases).",
    "Complex business logic expressed as huge Choice trees in JSON: keep logic in code (Lambda/ECS) and use Step Functions only for the coordination between steps."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "Step Functions is an AWS-managed regional service that lives outside your VPC. Its API is a public HTTPS endpoint that only accepts SigV4-signed IAM requests; in the reference architecture only EventBridge, API Gateway, and workloads inside the VPC start executions. The Lambda functions and ECS tasks it orchestrates are the things that live in your subnets.",
    securityGroup: "Not applicable — Step Functions itself has no ENI in your VPC. Security groups apply to the Lambda functions (if VPC-attached) and ECS tasks that the state machine invokes, and to an optional interface VPC endpoint for the states API.",
    nacl: "Not applicable to the service. Private application subnets must allow outbound TCP 443 and inbound ephemeral return traffic if ECS tasks call StartExecution or SendTaskSuccess.",
    routeTable: "ECS tasks or VPC-attached Lambda functions calling the Step Functions API from private subnets need a 0.0.0.0/0 route to the NAT Gateway, or no internet route at all if you create an interface VPC endpoint with private DNS.",
    nat: "Optional. Required only for private-subnet callers that reach the public states endpoint without a VPC endpoint. Step Functions invoking Lambda/ECS/SDK targets does not use your NAT.",
    igw: "Not required. Step Functions never sits behind your Internet Gateway; only the NAT Gateway (in a public subnet) uses the IGW when private callers reach the public endpoint.",
    vpcOptional: "Optional: create an interface VPC endpoint (com.amazonaws.<region>.states, plus the sync-states endpoint for Express synchronous executions) so private subnets call Step Functions without NAT; attach an endpoint policy limiting states:StartExecution to your state machines."
  },
  dataFlow: {
    in: [
      "StartExecution calls with a JSON input (for example the OrderPlaced event) from EventBridge rules, API Gateway integrations, ECS tasks, or Lambda.",
      "Task results: Lambda responses, ECS task exit status (.sync), DynamoDB/SQS/SNS API responses returned into the state's ResultPath.",
      "SendTaskSuccess / SendTaskFailure callbacks carrying a task token from external systems (payment webhooks, warehouse confirmations)."
    ],
    out: [
      "Service invocations: lambda:Invoke, ecs:RunTask, dynamodb:UpdateItem, sqs:SendMessage, sns:Publish, each with parameters built from the state's input.",
      "Execution history and CloudWatch Logs (Express and optionally Standard), metrics (ExecutionsFailed, ExecutionsTimedOut, ExecutionThrottled), X-Ray traces.",
      "'Step Functions Execution Status Change' events on the default EventBridge bus when an execution succeeds, fails, times out, or is aborted."
    ]
  },
  networking: [
    "The state machine talks to AWS APIs over the AWS network; it needs no subnets, security groups, or routes of its own.",
    "Callers inside private subnets (ECS tasks) reach states.<region>.amazonaws.com over HTTPS 443 via the NAT Gateway or, recommended, an interface VPC endpoint.",
    "Lambda functions orchestrated by the workflow that must reach RDS are VPC-attached; they then need NAT or VPC endpoints for any AWS API they call themselves.",
    "ecs:runTask targets place tasks in the subnets and security groups you specify in the state's NetworkConfiguration (private app subnets, ecs-sg).",
    "External systems that answer with a task token call the public Step Functions API (via your API Gateway/Lambda webhook) — they never need VPC access."
  ],
  security: {
    iam: "Two sides: callers need states:StartExecution on the state machine ARN, and the state machine has an execution role (trusted by states.amazonaws.com) that grants exactly the actions its Task states perform.",
    securityGroups: "Not applicable to Step Functions. The Lambda functions and ECS tasks it invokes keep their own security groups (ECS tasks in ecs-sg reaching RDS via rds-sg).",
    nacl: "Not applicable to the service itself; subnet NACLs affect only the VPC-resident callers and targets.",
    encryption: "TLS 1.2+ in transit. Execution data (input, output, history) is encrypted at rest with an AWS-owned key by default; a customer managed KMS key is optional for state machines and activities.",
    authentication: "All API calls are SigV4-signed by an IAM principal: an EventBridge target role, an API Gateway integration role, or the ECS task role.",
    authorization: "IAM policies on states:* actions scoped to specific state machine and execution ARNs; the execution role is scoped to the specific Lambda function ARNs, table ARNs, and queue ARNs it touches.",
    secrets: "Never put card numbers, tokens, or passwords in execution input: the full input/output of every state is visible to anyone with states:GetExecutionHistory. Pass identifiers and let the Lambda function fetch secrets from Secrets Manager.",
    leastPrivilege: "One execution role per state machine; lambda:InvokeFunction limited to named functions; iam:PassRole limited to the ECS task/execution roles the workflow may pass; no wildcard resources."
  },
  iam: [
    "Execution role (trust states.amazonaws.com): lambda:InvokeFunction on reserve-inventory, charge-payment, create-shipment, refund-payment, release-inventory ARNs; sns:Publish on the order-events topic; dynamodb:UpdateItem on the orders table if used directly.",
    "For ecs:runTask.sync tasks the role also needs ecs:RunTask, ecs:StopTask, ecs:DescribeTasks, iam:PassRole (task and execution roles), and events:PutTargets/PutRule/DescribeRule on the StepFunctionsGetEventsForECSTaskRule managed rule.",
    "Logging and tracing: logs:CreateLogDelivery, logs:PutResourcePolicy, logs:UpdateLogDelivery, logs:DescribeLogGroups (and related) for CloudWatch Logs; xray:PutTraceSegments and xray:PutTelemetryRecords when X-Ray tracing is enabled.",
    "Callers: the EventBridge rule target role needs states:StartExecution on the state machine ARN; API Gateway integration role or ECS task role need the same; webhook Lambdas need states:SendTaskSuccess/SendTaskFailure.",
    "Operators/CI: states:CreateStateMachine, states:UpdateStateMachine, states:PublishStateMachineVersion, plus iam:PassRole for the execution role."
  ],
  scaling: [
    "Standard workflows: executions run up to one year; API rates (StartExecution, state transitions) are soft, per-Region quotas that AWS raises on request — design so a burst of orders does not exceed them, or buffer starts through SQS/EventBridge.",
    "Express workflows are designed for very high event rates (hundreds of thousands per second) with executions capped at five minutes.",
    "Map state runs items concurrently (inline Map up to 40 concurrent iterations); Distributed Map fans out to up to 10,000 parallel child executions over S3 datasets.",
    "A Standard execution history is limited to 25,000 events, so long loops must be split into nested (child) state machines.",
    "The workflow scales only as far as its targets: Lambda concurrency, ECS cluster capacity, and RDS connection limits become the bottleneck, so apply concurrency limits in Map states."
  ],
  availability: [
    "Regional service replicated across multiple Availability Zones; every completed state transition of a Standard workflow is durably stored, so an infrastructure fault does not lose progress.",
    "Failed Standard executions can be redriven from the failed state (within 14 days) after you fix the downstream bug, instead of restarting from scratch.",
    "Retry with exponential backoff and Catch handle transient target failures without human involvement.",
    "There is no cross-Region replication of executions; for regional DR deploy the state machine definition (IaC) in a second Region and re-drive from the event source (EventBridge archive/replay, SQS).",
    "Design every Task to be idempotent so a redrive, retry, or replayed event does not double-charge or double-ship."
  ],
  cost: [
    "Standard workflows are billed per state transition (a small free tier per month, then per 1,000 transitions): an 8-state saga costs 8 transitions per order; Retry attempts and loops multiply that.",
    "Express workflows are billed per request plus duration × memory consumed, which is far cheaper for high-volume short workflows.",
    "Wait states and waitForTaskToken cost nothing while waiting — unlike a Lambda polling loop.",
    "The invoked services (Lambda, ECS, DynamoDB, SNS) are billed separately; at high volume CloudWatch Logs ingestion for Express workflows with ALL-level logging can exceed the workflow cost.",
    "Reduce cost by using direct SDK integrations instead of pass-through Lambda functions and by keeping the number of Pass/Choice states low."
  ],
  commonMistakes: [
    "Retrying a non-idempotent step (ChargePayment) on States.Timeout and charging the customer twice; the payment call must carry an idempotency key such as the orderId.",
    "Catching States.ALL and jumping to a Fail state without compensation, leaving inventory reserved and payment captured.",
    "Omitting TimeoutSeconds on Task states — a hung Lambda or lost callback then blocks the execution for up to a year.",
    "Passing whole documents or images through state input/output (256 KB limit per state); store the payload in S3 and pass the key.",
    "Polling for a job result with a Wait + Lambda loop instead of using .sync or .waitForTaskToken integration patterns.",
    "Putting business logic in giant Choice trees; the definition becomes untestable and every rule change is a deploy of the state machine.",
    "Including sensitive data in the input; it is readable in the execution history by anyone with describe permissions."
  ],
  bestPractices: [
    "Make every Task idempotent (orderId as the idempotency key) — including the compensation tasks, which may also be retried.",
    "Retry only on transient errors (Lambda.ServiceException, Lambda.TooManyRequestsException, States.Timeout) with BackoffRate and MaxAttempts; Catch everything else into a compensation path.",
    "Set TimeoutSeconds on every Task and HeartbeatSeconds on callback tasks so stuck steps fail fast.",
    "Keep state small with ResultPath/ResultSelector/OutputPath; store blobs in S3.",
    "Enable CloudWatch Logs (ERROR level in production) and X-Ray; alarm on ExecutionsFailed, ExecutionsTimedOut, and ExecutionThrottled.",
    "Define the state machine in IaC and publish versions with aliases so deployments can be rolled back and in-flight executions keep their definition.",
    "Start executions from an EventBridge rule with a retry policy and DLQ so a failed StartExecution is not silently lost."
  ],
  creationSteps: [
    "Open the AWS Console and go to Step Functions → State machines → Create state machine.",
    "Choose 'Design your workflow visually' (Workflow Studio) or 'Write your workflow in code', and select type 'Standard'.",
    "Add a Task state 'ReserveInventory' using the Lambda Invoke integration and select the reserve-inventory function.",
    "Add Task states 'ChargePayment' (Lambda), 'CreateShipment' (Lambda), and 'NotifyCustomer' (SNS Publish to the order-events topic) in sequence.",
    "Add compensation Task states 'RefundPayment' and 'ReleaseInventory' and a Fail state 'OrderFailed'.",
    "On each Task open Error handling: add a Retry (Lambda.ServiceException, interval 2 s, max 3 attempts, backoff 2) and a Catch on States.ALL that routes to the correct compensation state, and set a timeout (30–60 s).",
    "Name the state machine 'order-fulfillment' and let the console create an execution role from the generated policy (or select an existing least-privilege role).",
    "Under Logging choose a CloudWatch log group with level ERROR and enable X-Ray tracing; click Create.",
    "Click Start execution with a sample input such as {\"orderId\":\"o-123\",\"amount\":49.9,\"items\":[...]}, watch the graph, and inspect each state's input/output.",
    "Go to EventBridge → Rules → Create rule on the 'orders' bus matching detail-type 'OrderPlaced' with the state machine as target; create the target role with states:StartExecution and attach an SQS DLQ.",
    "Create CloudWatch alarms on ExecutionsFailed and ExecutionsTimedOut for the state machine and route them to the ops SNS topic.",
    "Export the definition (Actions → Export) and commit it to your Terraform/CDK repository."
  ],
  productionRecommendations: [
    "Standard workflow for the order saga; Express only for high-volume steps under 5 minutes.",
    "Retry/Catch on every Task with compensation states; all tasks idempotent by orderId.",
    "TimeoutSeconds on every Task; HeartbeatSeconds on callback tasks.",
    "One least-privilege execution role per state machine; no wildcard function ARNs.",
    "Logging at ERROR level plus X-Ray; alarms on failed and timed-out executions.",
    "Definition in IaC with published versions and an alias used by the EventBridge trigger."
  ],
  configExample: {
    title: "Amazon States Language — fulfillment saga with Retry/Catch and compensation",
    lang: "json",
    code: `{
  "StartAt": "ReserveInventory",
  "States": {
    "ReserveInventory": {
      "Type": "Task", "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": { "FunctionName": "reserve-inventory", "Payload.$": "$" },
      "ResultPath": "$.inventory", "TimeoutSeconds": 30,
      "Retry": [{ "ErrorEquals": ["Lambda.ServiceException", "Lambda.TooManyRequestsException"], "IntervalSeconds": 2, "MaxAttempts": 3, "BackoffRate": 2.0 }],
      "Catch": [{ "ErrorEquals": ["States.ALL"], "ResultPath": "$.error", "Next": "OrderFailed" }], "Next": "ChargePayment"
    },
    "ChargePayment": {
      "Type": "Task", "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": { "FunctionName": "charge-payment", "Payload.$": "$" },
      "ResultPath": "$.payment", "TimeoutSeconds": 60,
      "Retry": [{ "ErrorEquals": ["Lambda.ServiceException"], "MaxAttempts": 2 }],
      "Catch": [{ "ErrorEquals": ["States.ALL"], "ResultPath": "$.error", "Next": "ReleaseInventory" }], "Next": "CreateShipment"
    },
    "CreateShipment": {
      "Type": "Task", "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": { "FunctionName": "create-shipment", "Payload.$": "$" },
      "ResultPath": "$.shipment", "TimeoutSeconds": 60,
      "Catch": [{ "ErrorEquals": ["States.ALL"], "ResultPath": "$.error", "Next": "RefundPayment" }], "Next": "NotifyCustomer"
    },
    "NotifyCustomer": { "Type": "Task", "Resource": "arn:aws:states:::sns:publish",
      "Parameters": { "TopicArn": "arn:aws:sns:eu-west-1:123456789012:order-events", "Message.$": "$.orderId" }, "End": true },
    "RefundPayment":    { "Type": "Task", "Resource": "arn:aws:states:::lambda:invoke", "Parameters": { "FunctionName": "refund-payment",    "Payload.$": "$" }, "ResultPath": null, "Next": "ReleaseInventory" },
    "ReleaseInventory": { "Type": "Task", "Resource": "arn:aws:states:::lambda:invoke", "Parameters": { "FunctionName": "release-inventory", "Payload.$": "$" }, "ResultPath": null, "Next": "OrderFailed" },
    "OrderFailed": { "Type": "Fail", "Error": "OrderFulfillmentFailed", "Cause": "A step failed after retries; compensation ran" }
  }
}`
  },
  productionChecklist: [
    "Standard workflow type chosen for the saga; Express only where < 5 min and high volume.",
    "Every Task has TimeoutSeconds; callback tasks have HeartbeatSeconds.",
    "Retry only on transient errors; Catch routes to compensation states.",
    "All tasks (and compensations) idempotent by orderId.",
    "Execution role scoped to specific function/topic/table ARNs.",
    "No secrets or card data in execution input.",
    "CloudWatch Logs (ERROR) and X-Ray enabled; alarms on ExecutionsFailed/TimedOut.",
    "Triggered from EventBridge with retry policy and DLQ.",
    "Definition versioned in IaC with an alias.",
    "Redrive procedure documented and tested."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "An execution role for the state machine and states:StartExecution for whoever triggers it." },
    { id: "lambda", kind: "recommended", why: "Most Task states invoke Lambda functions that hold the business logic." },
    { id: "eventbridge", kind: "recommended", why: "The OrderPlaced rule starts the fulfillment execution with retry and DLQ." },
    { id: "cloudwatch", kind: "recommended", why: "Execution logs, metrics, and alarms on failed executions." },
    { id: "sns", kind: "optional", why: "Direct sns:publish integration for customer/ops notifications." },
    { id: "ecs", kind: "optional", why: "ecs:runTask.sync runs long jobs (reports, reconciliation) as Fargate tasks." },
    { id: "dynamodb", kind: "optional", why: "Direct SDK integration to read/write order state without a Lambda function." },
    { id: "api-gateway", kind: "optional", why: "A REST integration can call StartExecution for synchronous or async API-triggered workflows." },
    { id: "sqs", kind: "alternative", why: "For a single hand-off with no multi-step coordination, a queue plus a worker is simpler and cheaper." }
  ],
  related: ["lambda", "eventbridge", "sqs", "sns", "ecs", "dynamodb"],
  ecommerceRole: "Runs the order fulfillment saga after EventBridge delivers OrderPlaced: reserve inventory, charge payment, create shipment, notify — and refunds/releases stock when a later step fails. It orchestrates the Lambda functions (and optionally ECS tasks) that do the work.",
  failure: {
    title: "A workflow step fails",
    whatHappens: "The Task state raises an error (a Lambda exception, States.Timeout, States.TaskFailed, or a throttling error). Step Functions first consults the state's Retry array: if an ErrorEquals entry matches, it waits IntervalSeconds × BackoffRate^n and re-invokes the task up to MaxAttempts. When retries are exhausted the Catch array is evaluated and the execution transitions to the named handler state (the compensation path) with the error written to ResultPath. If nothing catches it, the execution fails (ExecutionsFailed increments) and, for Standard workflows, the full history is preserved and the execution can be redriven from the failed state within 14 days. Steps that already completed stay completed — inventory stays reserved and payment stays captured — which is exactly why the Catch must lead to compensation.",
    awsMechanisms: [
      "Per-state Retry (ErrorEquals, IntervalSeconds, MaxAttempts, BackoffRate, optional jitter) and Catch with ResultPath.",
      "TimeoutSeconds and HeartbeatSeconds turn hung tasks into catchable States.Timeout errors.",
      "Redrive of failed Standard executions from the point of failure.",
      "CloudWatch metrics (ExecutionsFailed, ExecutionsTimedOut, ExecutionsAborted) and 'Execution Status Change' events on EventBridge for alerting."
    ],
    mitigations: [
      "Idempotent tasks so retries and redrives never double-charge or double-ship.",
      "Explicit compensation states (RefundPayment, ReleaseInventory) wired from every Catch.",
      "Alarms on ExecutionsFailed routed to SNS; a 'needs-review' SQS queue fed from the failure path.",
      "Retry policy and DLQ on the EventBridge rule so the initial StartExecution is not lost either."
    ]
  },
  beginnerConnectionHint: "EventBridge (or API Gateway) tells Step Functions 'an order was placed', and Step Functions then calls the Lambda functions one after another, publishes to SNS at the end, and reports its progress to CloudWatch."
}, {
  id: "sqs",
  name: "Amazon SQS",
  shortName: "SQS",
  fullName: "Amazon Simple Queue Service",
  category: "integration",
  icon: "📬",
  tagline: "Fully managed message queues that decouple and buffer producers from consumers",
  whatIsIt: "Amazon SQS is a fully managed message queuing service. Producers send messages to a queue over HTTPS; consumers poll the queue, process each message, and delete it. The queue absorbs bursts, retries failed work automatically, and lets the API tier and background workers scale and fail independently.",
  eli5: "SQS is like the order-ticket rail in a busy kitchen. Waiters (the website) clip tickets on the rail and go straight back to the tables; cooks (the workers) grab one ticket at a time when they are free. If a cook drops a ticket, it goes back on the rail for someone else. Tickets nobody can cook after several tries go into a special 'problem' tray for the manager.",
  technical: "SQS exposes an HTTPS API (SendMessage, ReceiveMessage, DeleteMessage, ChangeMessageVisibility, with batch variants of up to 10 messages). Delivery is pull-based. Standard queues offer nearly unlimited throughput, at-least-once delivery, and best-effort ordering; FIFO queues deliver in order per MessageGroupId with exactly-once processing via a 5-minute deduplication window, at 300 API calls per second (3,000 messages with batching) or more in high-throughput mode. A received message is hidden for the visibility timeout (default 30 s, max 12 h); if not deleted in time it becomes visible again. Messages are retained 1 minute to 14 days (default 4 days); a redrive policy moves a message to a dead-letter queue once its ReceiveCount exceeds maxReceiveCount.",
  whyUse: [
    "Decouple the API from slow work: the checkout returns in milliseconds while confirmation emails, image resizing, and ERP inventory sync happen in the background.",
    "Absorb bursts: a flash sale enqueues thousands of jobs per second while workers drain at the pace RDS and third-party APIs can sustain.",
    "Built-in retry and failure isolation: a crashed worker's message reappears after the visibility timeout; poison messages land in a dead-letter queue instead of blocking the line.",
    "Scale consumers on backlog: ECS worker tasks or Lambda functions scale with queue depth, independently of the API tier.",
    "No brokers to run, patch, or replicate; the queue is durable across Availability Zones."
  ],
  whenToUse: [
    "Background jobs after an order: send confirmation email, generate invoice PDF, sync stock levels to the warehouse system.",
    "Image processing pipeline: upload to S3 → enqueue key → ECS worker resizes and writes thumbnails.",
    "Smoothing write spikes into RDS: workers apply inventory updates at a controlled concurrency instead of hundreds of API tasks hitting the database at once.",
    "Per-order ordering with a FIFO queue (MessageGroupId = orderId) when status updates must be applied in sequence.",
    "As the durable landing zone for SNS fan-out or EventBridge targets, and as the dead-letter queue for Lambda, SNS, and EventBridge."
  ],
  whenNotToUse: [
    "One event must reach many consumers: each SQS message is consumed once, so publish to SNS or EventBridge and subscribe one queue per consumer.",
    "Synchronous request/response where the caller waits for the answer: call the service directly through the ALB or API Gateway.",
    "Ordered, replayable streams read by multiple independent applications: Kinesis Data Streams keeps records for re-reading; SQS deletes on consume.",
    "Multi-step coordination with compensation: Step Functions; a queue cannot express 'if step 3 fails undo step 2'.",
    "Payloads larger than the message size limit (256 KB historically, now up to 1 MiB): store the object in S3 and send only the key."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "SQS is an AWS-managed regional service outside your VPC. Its endpoint (sqs.<region>.amazonaws.com) is public HTTPS but only accepts SigV4-signed IAM requests; in the reference architecture only ECS tasks in private subnets, Lambda, SNS, and EventBridge talk to it. Private subnets reach it via the NAT Gateway or, recommended, an interface VPC endpoint.",
    securityGroup: "Not applicable to the queue itself. The ECS API and worker security groups must allow outbound TCP 443; if you use an interface VPC endpoint, its ENI security group must allow inbound 443 from the ECS security group.",
    nacl: "The private application subnet NACL must allow outbound TCP 443 and inbound ephemeral ports (1024–65535) for responses. Long-polling responses can take up to 20 s, which is fine for stateless NACLs.",
    routeTable: "Private app subnets need 0.0.0.0/0 → NAT Gateway to reach the public endpoint, or no internet route at all when an interface endpoint with private DNS is present (DNS resolves to private IPs in your subnets).",
    nat: "Optional. Required for private-subnet producers/consumers only when no interface VPC endpoint exists; the NAT data-processing charge for chatty polling is a good reason to add the endpoint.",
    igw: "Not required for SQS. The IGW is used only indirectly by the NAT Gateway; SQS itself is never exposed through your IGW.",
    vpcOptional: "Optional but recommended: an interface VPC endpoint com.amazonaws.<region>.sqs in each private app subnet with private DNS enabled and an endpoint policy allowing only your queues; add aws:sourceVpce conditions to queue policies to force traffic through it."
  },
  dataFlow: {
    in: [
      "SendMessage / SendMessageBatch calls from ECS API tasks (order-placed jobs) and Lambda functions.",
      "Messages delivered by SNS subscriptions and EventBridge rule targets (fan-out into per-consumer queues).",
      "Messages redriven from a dead-letter queue back to the source after a bug fix, and failed events dead-lettered by Lambda, SNS, or EventBridge."
    ],
    out: [
      "ReceiveMessage responses (up to 10 messages per call) to ECS worker tasks or to the Lambda event source mapping pollers.",
      "Messages whose ReceiveCount exceeds maxReceiveCount, moved to the dead-letter queue.",
      "Metrics to CloudWatch: ApproximateNumberOfMessagesVisible, ApproximateAgeOfOldestMessage, NumberOfMessagesSent/Received/Deleted, NumberOfEmptyReceives."
    ]
  },
  networking: [
    "Producers and consumers call sqs.<region>.amazonaws.com over HTTPS 443; there is no port to open on the queue.",
    "ECS worker tasks in private subnets need a NAT route or an interface VPC endpoint; a Lambda consumer that is not VPC-attached needs nothing.",
    "Create the interface endpoint in both AZs' private app subnets, enable private DNS, and allow 443 from ecs-sg on the endpoint's security group.",
    "Long polling holds the HTTP connection up to 20 s (WaitTimeSeconds); set client socket/read timeouts above that to avoid spurious errors.",
    "Use the regional endpoint name (or the queue URL returned by the API) rather than legacy queue.amazonaws.com hostnames."
  ],
  security: {
    iam: "Identity policies on the ECS task roles grant sqs:SendMessage (API) or sqs:ReceiveMessage/DeleteMessage/ChangeMessageVisibility/GetQueueAttributes (worker) on the queue ARN. A resource-based queue access policy is required for SNS or EventBridge to deliver, using aws:SourceArn conditions.",
    securityGroups: "Not applicable to SQS. Only the interface VPC endpoint ENI carries a security group (inbound 443 from the application security group).",
    nacl: "Not applicable to the service; the private app subnet NACL must allow outbound 443 and inbound ephemeral return traffic.",
    encryption: "TLS in transit; deny non-TLS with an aws:SecureTransport=false Deny statement in the queue policy. At rest: SSE-SQS (AWS-owned key, default on new queues) or SSE-KMS with a customer managed key whose policy also allows sns.amazonaws.com / events.amazonaws.com if those services produce into the queue.",
    authentication: "Every request is SigV4-signed by an IAM principal (task role, Lambda execution role, or an AWS service principal such as sns.amazonaws.com).",
    authorization: "The union of the caller's IAM policy and the queue's access policy must allow the action; never use Principal \"*\" without a Condition.",
    secrets: "Message bodies are readable by any principal allowed to ReceiveMessage. Do not put card numbers or credentials in messages; send identifiers and let the worker read the data from RDS/Secrets Manager.",
    leastPrivilege: "Producers get only sqs:SendMessage; consumers get only receive/delete/visibility actions; nobody at runtime gets sqs:PurgeQueue or sqs:DeleteQueue; scope every statement to the specific queue ARN."
  },
  iam: [
    "ECS API task role: sqs:SendMessage (and sqs:GetQueueUrl) on arn:aws:sqs:<region>:<account>:orders-jobs.",
    "ECS worker task role: sqs:ReceiveMessage, sqs:DeleteMessage, sqs:ChangeMessageVisibility, sqs:GetQueueAttributes on the same queue ARN; add sqs:SendMessage on the DLQ only if the worker dead-letters explicitly.",
    "Lambda consumer execution role: the same receive/delete/GetQueueAttributes actions (AWSLambdaSQSQueueExecutionRole managed policy) — Lambda's poller uses the function's role.",
    "Queue access policy: Allow sns.amazonaws.com or events.amazonaws.com sqs:SendMessage with Condition aws:SourceArn = the topic or rule ARN; for a DLQ used by EventBridge/SNS/Lambda the same pattern with the source resource ARN.",
    "With SSE-KMS, the KMS key policy must grant kms:GenerateDataKey and kms:Decrypt to producers and consumers and to any AWS service principal that sends into the queue."
  ],
  scaling: [
    "Standard queues scale to nearly unlimited throughput without configuration; FIFO queues are limited per API call and per message group (300 TPS, 3,000 with batching, higher with high-throughput FIFO).",
    "There is a limit on in-flight (received but not deleted) messages — about 120,000 for standard and 20,000 for FIFO queues — so slow consumers should not hold huge batches.",
    "Scale ECS workers with Application Auto Scaling on a backlog-per-task metric (ApproximateNumberOfMessagesVisible ÷ running tasks) or step scaling on queue depth and ApproximateAgeOfOldestMessage.",
    "Lambda consumers scale automatically through the event source mapping (batch size, batching window, maximum concurrency setting); use ReportBatchItemFailures so one bad record does not retry the whole batch.",
    "Batch SendMessageBatch/ReceiveMessage (10 messages) and long polling cut request counts and cost by up to 10x."
  ],
  availability: [
    "Messages are stored redundantly across multiple Availability Zones within the Region before SendMessage returns success.",
    "If every worker is down, messages simply wait — up to the retention period (max 14 days) — and nothing is lost as long as they are consumed before expiry.",
    "Dead-letter queues preserve messages that repeatedly fail; set the DLQ retention longer than the source queue because expiry is based on the original enqueue time.",
    "At-least-once delivery means duplicates are possible on standard queues (and on FIFO outside the 5-minute dedup window): consumers must be idempotent.",
    "There is no cross-Region replication; for regional DR the producers must fail over to a queue in the other Region (deploy queues via IaC in both)."
  ],
  cost: [
    "Per million API requests (first million per month free); every 64 KB chunk of a payload counts as one request, and empty ReceiveMessage calls are billed too — long polling and batching reduce this.",
    "FIFO queues cost slightly more per request than standard queues.",
    "Data transfer out of the Region and, without a VPC endpoint, NAT Gateway data-processing charges for all polling traffic from private subnets.",
    "KMS API calls when using SSE-KMS (the data key reuse period reduces them); SSE-SQS is free.",
    "Interface VPC endpoints are billed per hour per AZ plus per GB processed — usually still cheaper than NAT for chatty workers."
  ],
  commonMistakes: [
    "Visibility timeout shorter than the worker's processing time, so a second worker receives the same message while the first is still working (duplicate emails, double inventory updates).",
    "Non-idempotent consumers that assume exactly-once delivery from a standard queue.",
    "No dead-letter queue — or a DLQ that nobody monitors, so failed orders sit silently for 14 days and expire.",
    "Short polling in a tight loop (WaitTimeSeconds = 0) producing millions of billable empty receives.",
    "Forgetting the queue access policy for SNS or EventBridge, so deliveries fail silently (visible only in the source service's failure metrics).",
    "Deleting the message before processing succeeds (delete-then-process) instead of after.",
    "Workers in private subnets with neither a NAT route nor a VPC endpoint, causing connection timeouts that look like an SQS outage."
  ],
  bestPractices: [
    "Make consumers idempotent: a processed-jobs table in DynamoDB or RDS keyed by messageId or (orderId, jobType), or FIFO deduplication ids.",
    "Visibility timeout ≥ the worst-case processing time (for Lambda: at least 6× the function timeout); extend it with ChangeMessageVisibility as a heartbeat for long jobs.",
    "Always attach a DLQ with maxReceiveCount 3–5 and alarm when ApproximateNumberOfMessagesVisible on the DLQ is > 0.",
    "Long polling (WaitTimeSeconds = 20) and batch APIs; process then delete, per message.",
    "Alarm on ApproximateAgeOfOldestMessage to detect stuck or under-scaled consumers; scale workers on backlog per task.",
    "SSE enabled, TLS enforced through the queue policy, and an interface VPC endpoint for private subnets.",
    "Use the DLQ redrive feature to move messages back to the source queue after deploying the fix — do not re-send by hand."
  ],
  creationSteps: [
    "Open the AWS Console and go to Amazon SQS → Create queue.",
    "Create the dead-letter queue first: type Standard, name 'orders-jobs-dlq', retention 14 days, encryption SSE-SQS; click Create queue.",
    "Click Create queue again for the main queue: type Standard, name 'orders-jobs'.",
    "Set Visibility timeout to 300 seconds (or your worst-case job time), Message retention 4 days, Delivery delay 0, Receive message wait time 20 seconds.",
    "Under Encryption keep Amazon SQS key (SSE-SQS) or choose a customer managed KMS key.",
    "Under Access policy keep 'Basic' (only the queue owner can send/receive); add a statement for sns.amazonaws.com / events.amazonaws.com with aws:SourceArn only if those services will deliver into it.",
    "Under Dead-letter queue choose Enabled, select 'orders-jobs-dlq', and set Maximum receives to 5.",
    "Click Create queue and copy the queue URL and ARN.",
    "In IAM, attach sqs:SendMessage on the queue ARN to the ECS API task role and receive/delete/visibility actions to the ECS worker task role.",
    "Optionally create an interface VPC endpoint (com.amazonaws.<region>.sqs) in the private app subnets with private DNS enabled and 443 allowed from the ECS security group.",
    "Create CloudWatch alarms on the DLQ's ApproximateNumberOfMessagesVisible > 0 and the main queue's ApproximateAgeOfOldestMessage.",
    "Send a test message from the console, confirm the worker consumes and deletes it, then check metrics."
  ],
  productionRecommendations: [
    "Standard queue unless per-key ordering is a hard requirement; then FIFO with MessageGroupId = orderId.",
    "Visibility timeout tuned to the job, DLQ with maxReceiveCount 3–5, DLQ retention 14 days.",
    "Long polling, batching, idempotent consumers keyed on a business id.",
    "SSE on, TLS enforced in the queue policy, least-privilege producer/consumer roles.",
    "Interface VPC endpoint for private-subnet workers to avoid NAT costs and internet exposure.",
    "Alarms on DLQ depth and age of oldest message routed to SNS."
  ],
  configExample: {
    title: "Terraform — standard queue with dead-letter queue and redrive policy",
    lang: "hcl",
    code: `resource "aws_sqs_queue" "orders_dlq" {
  name                      = "orders-jobs-dlq"
  message_retention_seconds = 1209600            # 14 days: longer than the source queue
  sqs_managed_sse_enabled   = true
}

resource "aws_sqs_queue" "orders" {
  name                       = "orders-jobs"
  visibility_timeout_seconds = 300               # >= worst-case processing time
  message_retention_seconds  = 345600            # 4 days
  receive_wait_time_seconds  = 20                # long polling
  sqs_managed_sse_enabled    = true
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.orders_dlq.arn
    maxReceiveCount     = 5
  })
}

# Only the orders queue may use this DLQ
resource "aws_sqs_queue_redrive_allow_policy" "orders_dlq" {
  queue_url = aws_sqs_queue.orders_dlq.id
  redrive_allow_policy = jsonencode({
    redrivePermission = "byQueue"
    sourceQueueArns   = [aws_sqs_queue.orders.arn]
  })
}`
  },
  productionChecklist: [
    "Queue type chosen deliberately (Standard vs FIFO).",
    "Visibility timeout ≥ worst-case processing time (≥ 6× Lambda timeout).",
    "Dead-letter queue attached with maxReceiveCount 3–5; DLQ retention 14 days.",
    "Consumers idempotent; process-then-delete.",
    "Long polling (20 s) and batch APIs used.",
    "SSE enabled; aws:SecureTransport enforced in queue policy.",
    "Producer/consumer IAM scoped to the queue ARN; queue policy has no unconditional Principal \"*\".",
    "Interface VPC endpoint (or NAT route) in place for private-subnet workers.",
    "Alarms on DLQ depth and ApproximateAgeOfOldestMessage.",
    "Worker auto scaling on backlog per task configured."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Producer and consumer permissions plus the queue access policy for AWS service producers." },
    { id: "ecs", kind: "recommended", why: "The ECS worker service is the consumer in the reference architecture." },
    { id: "cloudwatch", kind: "recommended", why: "Queue depth, age of oldest message, and DLQ alarms." },
    { id: "auto-scaling", kind: "recommended", why: "Scales the worker service on backlog per task." },
    { id: "vpc", kind: "optional", why: "An interface VPC endpoint keeps polling traffic private and off the NAT Gateway." },
    { id: "nat-gateway", kind: "optional", why: "Needed by private-subnet workers only when no interface endpoint exists." },
    { id: "eventbridge", kind: "optional", why: "Rules can target a queue directly, and queues serve as EventBridge DLQs." },
    { id: "lambda", kind: "alternative", why: "A Lambda event source mapping is the serverless alternative to an ECS worker." },
    { id: "sns", kind: "alternative", why: "When one message must reach several consumers, publish to SNS and subscribe a queue per consumer." }
  ],
  related: ["sns", "eventbridge", "lambda", "ecs", "step-functions", "auto-scaling"],
  ecommerceRole: "Buffer between the ECS API and the ECS worker service: the API enqueues 'send confirmation email', 'resize product image', and 'sync inventory' jobs and returns immediately; workers drain the queue and write results to RDS. It also serves as the dead-letter queue for SNS, EventBridge, and Lambda.",
  failure: {
    title: "SQS consumer fails (worker crashes mid-message)",
    whatHappens: "The worker called ReceiveMessage, so the message is in flight and invisible to other consumers. The task crashes before DeleteMessage. Nothing happens until the visibility timeout expires (for example 300 s); then the message becomes visible again with ReceiveCount incremented and another worker (or the restarted one — the ECS service scheduler replaces the crashed task) receives it. If the message keeps failing, once ReceiveCount exceeds maxReceiveCount SQS moves it to the dead-letter queue and it stops poisoning the workers. Meanwhile ApproximateNumberOfMessagesVisible and ApproximateAgeOfOldestMessage climb, producers are completely unaffected, and if the worker had already performed a side effect (sent the email) before crashing, the redelivery repeats it unless the consumer is idempotent. If no consumer returns at all, messages wait up to the retention period and are then deleted.",
    awsMechanisms: [
      "Visibility timeout: automatic redelivery of unacknowledged messages without producer involvement.",
      "Redrive policy to a dead-letter queue after maxReceiveCount, and DLQ redrive back to the source after the fix.",
      "ECS service scheduler restarts crashed worker tasks; Lambda event source mappings retry and honour partial batch failures.",
      "CloudWatch metrics and alarms on queue depth, age of oldest message, and DLQ depth."
    ],
    mitigations: [
      "Idempotent processing keyed on messageId or a business id so redelivery is harmless.",
      "Visibility timeout sized to the job, extended by heartbeat for long jobs; process-then-delete.",
      "DLQ with alarm > 0 messages and a documented redrive runbook.",
      "Worker auto scaling on backlog so a crash-induced pile-up drains quickly; alarm on ApproximateAgeOfOldestMessage."
    ]
  },
  beginnerConnectionHint: "The ECS API (and SNS or EventBridge) drop messages into SQS, the ECS worker tasks (or Lambda) pick them up and write results to RDS, and SQS reports its queue length to CloudWatch so Auto Scaling can add workers."
}, {
  id: "sns",
  name: "Amazon SNS",
  shortName: "SNS",
  fullName: "Amazon Simple Notification Service",
  category: "integration",
  icon: "📣",
  tagline: "Managed pub/sub: publish once, fan out to queues, functions, HTTP, email, SMS, and push",
  whatIsIt: "Amazon SNS is a fully managed publish/subscribe messaging service. Publishers send a message to a topic and SNS pushes a copy to every subscription — SQS queues, Lambda functions, HTTP/S endpoints, email addresses, SMS numbers, mobile push platforms, and Data Firehose — optionally filtered per subscriber. It is also the standard notification channel for CloudWatch alarms and other AWS services.",
  eli5: "SNS is the school loudspeaker. When the head teacher makes one announcement, every classroom that signed up hears it at the same time — the teacher does not have to walk to each room. Some rooms get it as a note in their mailbox (a queue), some as a phone call, and you can say 'only tell the art club about art trips' so rooms don't hear things they don't care about.",
  technical: "A topic is a regional resource with an ARN; Publish sends a message (up to 256 KB, 10 per PublishBatch) that SNS durably stores across AZs and pushes to each subscription according to its protocol (sqs, lambda, http/https, email, sms, application/mobile push, firehose). Standard topics give high throughput, at-least-once delivery, and best-effort order; FIFO topics order by MessageGroupId with deduplication and deliver to SQS queues. Subscription filter policies match on message attributes or the message body (FilterPolicyScope), raw message delivery strips the SNS envelope, delivery policies define retries for HTTP/S endpoints, and a per-subscription redrive policy dead-letters undeliverable messages to an SQS queue.",
  whyUse: [
    "Fan-out: one OrderConfirmed message reaches the email service, analytics, and the warehouse without the publisher knowing about any of them.",
    "Human notifications: CloudWatch alarms, RDS events, and Auto Scaling events publish to a topic that emails or pages the on-call engineer.",
    "Message filtering delivers only relevant messages to each subscriber, so consumers do not discard 90% of what they receive.",
    "Push delivery to Lambda and SQS removes polling; paired with SQS per subscriber you get durable, independently consumed copies.",
    "Fully managed, pay-per-message, no brokers, with cross-account subscriptions for shared platform events."
  ],
  whenToUse: [
    "Order lifecycle notifications: order-events topic → email-jobs queue, analytics queue, warehouse queue (SNS → SQS fan-out).",
    "Operational alerting: CloudWatch alarm actions → ops-alerts topic → email and an HTTPS endpoint of your incident tool.",
    "Customer-facing push: shipping status to mobile apps via platform endpoints (APNs/FCM) or SMS for delivery updates.",
    "Cross-account or cross-team event distribution where consumers own their own queues and Lambda functions.",
    "Notifying many AWS services at once: S3 event notifications, RDS event subscriptions, and Auto Scaling lifecycle notifications can all publish to a topic."
  ],
  whenNotToUse: [
    "Work that must be buffered and processed at the consumer's pace with retries over days: SNS is push-only with limited retention — subscribe an SQS queue and consume from it.",
    "Content-based routing with many rules, schemas, archive, and replay: EventBridge routes on JSON patterns and keeps an archive; SNS routes only by topic plus attribute/body filters.",
    "Ordered, replayable streams read by many applications: Kinesis Data Streams.",
    "Multi-step processes with compensation: Step Functions.",
    "Branded transactional email with templates, bounce handling, and deliverability tooling: Amazon SES; SNS email is plain-text notification with a subscription-confirmation step."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "SNS is an AWS-managed regional service outside your VPC. Its endpoint (sns.<region>.amazonaws.com) is public HTTPS and accepts only SigV4-signed IAM requests; in the reference architecture the publishers are ECS tasks, Step Functions, and CloudWatch alarms, and the subscribers are SQS queues, Lambda, and people. Deliveries to HTTP/S endpoints originate from SNS on the AWS network, so such endpoints must be publicly reachable.",
    securityGroup: "Not applicable to the topic. Publishers' security groups need outbound TCP 443; an interface VPC endpoint's ENI needs inbound 443 from the application security group. An HTTP/S subscriber inside your VPC must be exposed through the ALB or API Gateway because SNS cannot reach private IPs.",
    nacl: "Private app subnet NACLs must allow outbound 443 and inbound ephemeral return traffic for publishers; the public subnet NACL must allow inbound 443 from the internet if the ALB fronts an HTTPS subscriber.",
    routeTable: "Publishers in private subnets need 0.0.0.0/0 → NAT Gateway, or an interface VPC endpoint (com.amazonaws.<region>.sns) with private DNS and no internet route.",
    nat: "Optional. Only for private-subnet publishers without an interface endpoint; SNS deliveries to SQS/Lambda never touch your NAT.",
    igw: "Not required for SNS itself. An IGW is involved only if SNS must deliver to an HTTPS endpoint hosted behind your internet-facing ALB.",
    vpcOptional: "Optional: an interface VPC endpoint for the SNS API lets private ECS tasks publish without NAT; note that the endpoint covers publishing, not inbound deliveries to private HTTP endpoints."
  },
  dataFlow: {
    in: [
      "Publish / PublishBatch calls from ECS tasks, Lambda, and Step Functions (sns:publish integration) with message attributes such as eventType=OrderConfirmed.",
      "CloudWatch alarm state changes, RDS event subscriptions, Auto Scaling notifications, and S3 event notifications configured with the topic ARN as their action.",
      "Subscription confirmations from email and HTTP/S endpoints (SubscribeURL) before deliveries begin."
    ],
    out: [
      "Copies of each message delivered to every matching subscription: SQS SendMessage into subscriber queues, asynchronous Lambda invocations, HTTPS POSTs, emails, SMS, mobile push.",
      "Messages that fail all delivery retries moved to the subscription's dead-letter queue (SQS) when a redrive policy is set.",
      "Metrics (NumberOfMessagesPublished, NumberOfNotificationsDelivered, NumberOfNotificationsFailed, NumberOfNotificationsFilteredOut) and optional delivery status logs to CloudWatch."
    ]
  },
  networking: [
    "Publishers call sns.<region>.amazonaws.com over HTTPS 443 — via NAT or an interface VPC endpoint from private subnets; there is nothing to open inbound.",
    "SQS and Lambda subscribers are reached over the AWS network; no VPC configuration is involved for those deliveries.",
    "HTTP/S subscribers must have a public, TLS-terminated URL (ALB or API Gateway); the endpoint must first answer the SubscriptionConfirmation POST.",
    "SNS signs every HTTP/S delivery; verify the signature against the SigningCertURL before trusting the payload.",
    "Email subscriptions require the recipient to click the confirmation link; pending subscriptions receive nothing."
  ],
  security: {
    iam: "Publishers need sns:Publish on the topic ARN; the topic's access policy (resource-based) must additionally allow AWS service principals such as cloudwatch.amazonaws.com or events.amazonaws.com with an aws:SourceArn / aws:SourceAccount condition.",
    securityGroups: "Not applicable to the topic; only publisher egress and an optional interface endpoint ENI carry security groups.",
    nacl: "Not applicable to the service; subnet NACLs affect only publishers and any ALB-fronted HTTP subscriber.",
    encryption: "TLS in transit for all API calls and HTTPS deliveries. At rest, optional server-side encryption with a KMS customer managed key; the key policy must allow the publishing service principals (CloudWatch, EventBridge, S3) kms:GenerateDataKey and kms:Decrypt or their notifications fail silently.",
    authentication: "Publishers are SigV4-signed IAM principals or AWS service principals; SQS subscribers authorize SNS through their queue policy; HTTP subscribers authenticate SNS via message signature verification.",
    authorization: "Topic policy plus identity policies decide who may Publish and Subscribe; subscriber-side resource policies (SQS queue policy, Lambda resource policy) decide whether SNS may deliver.",
    secrets: "Messages are visible to every subscriber and, with delivery logging, in CloudWatch Logs; publish identifiers (orderId) rather than PII or credentials.",
    leastPrivilege: "Grant sns:Publish per topic to specific roles, restrict sns:Subscribe (anyone who can subscribe can read every message), and require Condition aws:SourceArn on service-principal statements."
  },
  iam: [
    "ECS API task role / Step Functions execution role: sns:Publish on arn:aws:sns:<region>:<account>:order-events.",
    "Topic access policy: Allow cloudwatch.amazonaws.com sns:Publish with Condition aws:SourceArn = the alarm ARN(s) (or aws:SourceAccount) for the ops-alerts topic; similarly events.amazonaws.com for EventBridge targets.",
    "Each subscribed SQS queue needs a queue policy allowing sns.amazonaws.com sqs:SendMessage with aws:SourceArn = the topic ARN; the console adds it, Terraform must do it explicitly.",
    "Lambda subscribers need a resource-based policy statement granting sns.amazonaws.com lambda:InvokeFunction for the topic ARN.",
    "Operators/CI: sns:CreateTopic, sns:SetTopicAttributes, sns:Subscribe, sns:SetSubscriptionAttributes; keep sns:Subscribe away from runtime roles."
  ],
  scaling: [
    "Standard topics accept very high publish rates (a soft per-Region quota in the tens of thousands of messages per second) and fan out to millions of subscriptions.",
    "FIFO topics trade throughput for ordering: a limited number of messages per second per topic, ordered per MessageGroupId.",
    "Deliveries to Lambda are asynchronous invocations bounded by the function's concurrency; deliveries into SQS are absorbed by the queue and consumed at the subscriber's pace.",
    "Filter policies are evaluated by SNS, so adding subscribers does not add load to publishers.",
    "PublishBatch (10 messages per call) reduces API calls for bulk notification producers."
  ],
  availability: [
    "Messages are stored across multiple Availability Zones before Publish returns success.",
    "Delivery retries: HTTP/S endpoints follow a configurable delivery policy (default 3 retries, customizable up to 100 retries within an hour); SQS and Lambda deliveries are retried with backoff for many hours (up to 23 days) if the service is unavailable.",
    "A subscription redrive policy dead-letters messages that exhaust retries into an SQS queue, so nothing is silently lost when the DLQ is configured.",
    "Each subscription is independent: a dead HTTP endpoint never delays deliveries to the SQS or Lambda subscribers.",
    "No cross-Region replication of topics; cross-Region SQS/Lambda subscriptions are supported, and DR means recreating topics and subscriptions via IaC in the second Region."
  ],
  cost: [
    "Publish requests are billed per million (with a monthly free tier); each 64 KB chunk counts as one request.",
    "Delivery cost depends on protocol: SQS and Lambda deliveries are free, HTTP/S is billed per million, email per 100,000, mobile push per million, and SMS per message with country-specific rates — SMS is by far the most expensive.",
    "FIFO topics are priced higher per message than standard topics.",
    "KMS requests when the topic uses a customer managed key; data transfer out for HTTP deliveries to the internet.",
    "SMS spending has an account-level monthly spend limit (default USD 1) that must be raised before production use."
  ],
  commonMistakes: [
    "Subscribing an SQS queue without the queue policy that lets sns.amazonaws.com send — deliveries fail and only NumberOfNotificationsFailed shows it.",
    "Encrypting a topic with a KMS key whose policy does not allow cloudwatch.amazonaws.com, so alarm notifications never arrive.",
    "Leaving email subscriptions in PendingConfirmation and assuming the on-call engineer is being paged.",
    "Writing a filter policy on message attributes while publishers send the fields only in the body (or vice versa) — everything is filtered out.",
    "Pointing critical business events straight at an HTTP endpoint or Lambda without a DLQ, so a 20-minute outage drops messages.",
    "Expecting ordering or exactly-once delivery from a standard topic.",
    "Publishing the full order (or PII) instead of an identifier, exposing it to every subscriber and log."
  ],
  bestPractices: [
    "SNS → SQS per consumer for anything that must not be lost; subscribe Lambda directly only for cheap, idempotent, non-critical handlers.",
    "Put routing keys in message attributes (eventType, region) and use filter policies so each queue receives only what it processes.",
    "Enable raw message delivery for SQS subscribers so workers parse your JSON, not the SNS envelope.",
    "Set a redrive policy (DLQ) on every SQS/Lambda/HTTP subscription and alarm on NumberOfNotificationsFailed and the DLQ depth.",
    "Encrypt topics carrying business data with a customer managed key that explicitly allows the publishing services.",
    "Turn on delivery status logging to CloudWatch Logs for HTTP/S and Lambda subscriptions while onboarding a new subscriber.",
    "Manage topics, subscriptions, queue policies, and filter policies in IaC so a missing statement is caught in review."
  ],
  creationSteps: [
    "Open the AWS Console and go to Amazon SNS → Topics → Create topic.",
    "Choose type Standard (or FIFO if per-key ordering is required) and name it 'order-events'.",
    "Under Encryption enable server-side encryption and pick a customer managed KMS key whose policy allows your publishers (and CloudWatch if alarms will publish).",
    "Under Access policy choose Advanced and allow sns:Publish for the ECS task role / Step Functions role; for an ops topic add cloudwatch.amazonaws.com with aws:SourceAccount.",
    "Click Create topic and copy the topic ARN.",
    "Open the topic → Create subscription → Protocol 'Amazon SQS' → Endpoint = the order-email-jobs queue ARN; tick 'Enable raw message delivery'.",
    "Expand Subscription filter policy and enter {\"eventType\":[\"OrderConfirmed\",\"OrderShipped\"]} with scope Message attributes.",
    "Expand Redrive policy and select the email-jobs DLQ; click Create subscription.",
    "In SQS, confirm the queue access policy contains the sns.amazonaws.com SendMessage statement with aws:SourceArn = the topic ARN (add it if you manage the queue in Terraform).",
    "Repeat for the analytics queue with its own filter policy; add an Email subscription for ops and confirm it from the inbox.",
    "Publish a test message from the console with attribute eventType=OrderConfirmed and verify it appears in both queues.",
    "Create CloudWatch alarms on NumberOfNotificationsFailed and on the DLQ's ApproximateNumberOfMessagesVisible."
  ],
  productionRecommendations: [
    "Fan out to SQS queues (raw delivery, filter policies) rather than to HTTP endpoints or Lambda for business-critical events.",
    "Redrive policy (DLQ) on every subscription and alarms on failed deliveries.",
    "Customer managed KMS key with a key policy that names the publishing services.",
    "Topic policy with aws:SourceArn/aws:SourceAccount conditions; no unconditional Principal \"*\".",
    "Confirm every email/HTTP subscription and page through a tool (HTTPS) rather than plain email for on-call.",
    "All topics, subscriptions, filter and queue policies in IaC."
  ],
  configExample: {
    title: "Terraform — topic with filtered SQS subscription (fan-out to the email service)",
    lang: "hcl",
    code: `resource "aws_sns_topic" "order_events" {
  name              = "order-events"
  kms_master_key_id = aws_kms_key.sns.arn   # key policy must allow the publishing services
}

resource "aws_sqs_queue" "email_jobs" { name = "order-email-jobs" }

resource "aws_sqs_queue_policy" "email_jobs" {
  queue_url = aws_sqs_queue.email_jobs.id     # required: lets the topic deliver into the queue
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "sns.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.email_jobs.arn
      Condition = { ArnEquals = { "aws:SourceArn" = aws_sns_topic.order_events.arn } }
    }]
  })
}

resource "aws_sns_topic_subscription" "email_jobs" {
  topic_arn            = aws_sns_topic.order_events.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.email_jobs.arn
  raw_message_delivery = true
  filter_policy_scope  = "MessageAttributes"
  filter_policy        = jsonencode({ eventType = ["OrderConfirmed", "OrderShipped"] })
  redrive_policy       = jsonencode({ deadLetterTargetArn = aws_sqs_queue.email_jobs_dlq.arn })
}`
  },
  productionChecklist: [
    "Topic type chosen deliberately (Standard vs FIFO).",
    "Every business subscriber is an SQS queue with raw delivery (or an idempotent Lambda with DLQ).",
    "Queue policies allow sns.amazonaws.com with aws:SourceArn = topic.",
    "Filter policies match how publishers actually set attributes/body.",
    "Redrive policy (DLQ) on each subscription; alarm on DLQ depth.",
    "Alarm on NumberOfNotificationsFailed.",
    "Server-side encryption with a CMK that allows the publishing services.",
    "Topic policy uses SourceArn/SourceAccount conditions; sns:Subscribe restricted.",
    "Email/HTTP subscriptions confirmed; HTTP endpoints verify SNS signatures.",
    "SMS spend limit raised and opt-out handling in place if SMS is used."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "Publish permissions, topic policy, and subscriber-side resource policies." },
    { id: "sqs", kind: "recommended", why: "Durable per-consumer queues are the standard fan-out target and the DLQ for subscriptions." },
    { id: "cloudwatch", kind: "recommended", why: "Alarm actions publish to SNS; delivery metrics and logs live in CloudWatch." },
    { id: "lambda", kind: "optional", why: "Lightweight subscribers invoked asynchronously per message." },
    { id: "step-functions", kind: "optional", why: "The fulfillment workflow publishes the final customer notification via sns:publish." },
    { id: "vpc", kind: "optional", why: "An interface VPC endpoint lets private ECS tasks publish without NAT." },
    { id: "eventbridge", kind: "alternative", why: "Choose EventBridge when routing depends on event content, schemas, or archive/replay." }
  ],
  related: ["sqs", "eventbridge", "cloudwatch", "lambda", "step-functions"],
  ecommerceRole: "Fan-out hub for notifications: the order-events topic delivers OrderConfirmed/OrderShipped copies to the email-service queue, the analytics queue, and mobile push, while the ops-alerts topic receives CloudWatch alarm actions and pages the on-call engineer.",
  failure: {
    title: "An SNS subscriber endpoint is down",
    whatHappens: "The publisher already received a 200 from Publish — SNS does not report delivery failures back to it. SNS attempts the push and gets a connection error, timeout, or 5xx. For an HTTP/S subscription it follows the delivery policy: by default 3 retries a few seconds apart, or up to 100 retries spread over as long as an hour if you customized it. For SQS and Lambda subscriptions (failures here mean the AWS service itself is unavailable or the resource policy is missing) SNS retries with backoff for a long period, up to 23 days. When retries are exhausted the message is dropped, unless the subscription has a redrive policy, in which case it is moved to the configured SQS dead-letter queue. All other subscriptions on the topic are unaffected because each is delivered independently. NumberOfNotificationsFailed increments and, if enabled, a delivery-status log entry records the failure.",
    awsMechanisms: [
      "Per-protocol delivery retry policies (customizable for HTTP/S; long backoff retries for SQS and Lambda).",
      "Subscription redrive policy to an SQS dead-letter queue.",
      "Delivery status logging to CloudWatch Logs and metrics NumberOfNotificationsFailed / NumberOfNotificationsRedrivenToDlq.",
      "Independent per-subscription delivery so one dead endpoint does not block the others."
    ],
    mitigations: [
      "Subscribe an SQS queue instead of a raw HTTP endpoint for anything important; the queue stays up when your consumer is down.",
      "Attach a DLQ to every subscription and alarm when it is non-empty; redrive after the fix.",
      "Alarm on NumberOfNotificationsFailed per topic.",
      "Make subscribers idempotent because retries can deliver a message that partially succeeded."
    ]
  },
  beginnerConnectionHint: "The ECS API, Step Functions, and CloudWatch alarms shout into SNS, and SNS repeats the message to every listener that signed up — SQS queues for the workers, Lambda functions, and email or phones for people."
}, {
  id: "eventbridge",
  name: "Amazon EventBridge",
  shortName: "EventBridge",
  fullName: "Amazon EventBridge",
  category: "integration",
  icon: "🚌",
  tagline: "Serverless event bus: match JSON events with rules and route them to AWS targets and APIs",
  whatIsIt: "Amazon EventBridge is a serverless event bus that receives JSON events from AWS services, your own applications, and SaaS partners, matches them against rules with JSON event patterns, and delivers them to targets such as Lambda, Step Functions, SQS, SNS, ECS tasks, and external HTTP APIs. It adds a schema registry, archive and replay, scheduled invocations (EventBridge Scheduler), and point-to-point Pipes.",
  eli5: "EventBridge is a very smart mail sorter at the post office. Every letter (an event) passes by, the sorter reads the label and, following the rules you wrote, drops copies into the right bins: 'letters about big orders go to the manager AND to the warehouse'. It also keeps a copy of every letter in a filing cabinet so you can re-send them later, and it has an alarm clock to send certain letters at a set time every night.",
  technical: "An event is a JSON envelope (source, detail-type, detail, time, resources, account, region; up to 256 KB) sent with PutEvents (up to 10 per call) to an event bus: the default bus (AWS service events), custom buses (application events), or partner buses (SaaS). Rules on a bus hold an event pattern — matching on exact values, prefix/suffix, anything-but, numeric ranges, exists, wildcards, and $or — and up to five targets, each with an optional input transformer, a retry policy (default up to 24 hours and 185 attempts), and an SQS dead-letter queue. Delivery is at-least-once. Archives capture matching events for replay; the schema registry discovers event schemas and generates code bindings; EventBridge Scheduler runs cron, rate, and one-time schedules with time zones.",
  whyUse: [
    "Decouple producers from consumers: the ECS API publishes OrderPlaced once, and loyalty, fulfillment, analytics, and search-indexing each subscribe with their own rule — adding a consumer never touches the API.",
    "Content-based routing: rules match on fields inside the event (status, total, country), not just on a topic name.",
    "React to AWS infrastructure events for free: ECS task state changes, EC2 state changes, GuardDuty findings, CodePipeline results, Health events.",
    "Scheduled jobs without cron servers: nightly reconciliation, hourly cache warm-ups, one-off 'cancel unpaid order in 30 minutes' timers.",
    "Archive and replay lets you rebuild a new consumer from history or re-drive events after an outage; the schema registry documents your event contracts."
  ],
  whenToUse: [
    "Business events from the ECS API on a custom 'orders' bus: OrderPlaced → Lambda (loyalty points to DynamoDB) + Step Functions (fulfillment) + SQS (analytics).",
    "Operational automation on the default bus: 'ECS Task State Change' with stoppedReason → Lambda that posts to SNS; 'RDS DB Instance Event' → ticket.",
    "Scheduled work with EventBridge Scheduler: run an ECS task at 02:00 Europe/Amsterdam to reconcile inventory; expire abandoned carts.",
    "Calling third-party APIs when something happens (API destinations with OAuth/API-key connections): notify the 3PL when a shipment is created.",
    "Ingesting SaaS events (partner sources such as Zendesk, Shopify, Auth0) into the same bus as your own events."
  ],
  whenNotToUse: [
    "Very high-throughput streaming with per-shard ordering and multi-reader replay: Kinesis Data Streams; EventBridge is per-event routing with soft TPS quotas.",
    "Consumer-paced buffered processing: SQS (or use SQS as the EventBridge target so the queue does the buffering).",
    "Notifying people by email/SMS/push or broadcasting to millions of subscribers: SNS is cheaper and supports those protocols.",
    "Multi-step orchestration with compensation: Step Functions — EventBridge should start the workflow, not implement it.",
    "Events larger than 256 KB or needing sub-50 ms delivery: put the payload in S3 and send a pointer, or call the service directly."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "EventBridge is an AWS-managed regional service outside your VPC. Its API (events.<region>.amazonaws.com) is public HTTPS and accepts only SigV4-signed IAM requests; in the reference architecture the ECS API publishes to a custom 'orders' bus, AWS services publish to the default bus, and targets are Lambda, Step Functions, SQS, and SNS — all reached over the AWS network.",
    securityGroup: "Not applicable to the bus. ECS producers need outbound TCP 443; an interface VPC endpoint's ENI needs inbound 443 from the ECS security group. ECS RunTask targets use the security groups you specify in the target's network configuration.",
    nacl: "The private app subnet NACL must allow outbound 443 and inbound ephemeral return traffic for PutEvents from ECS tasks.",
    routeTable: "Private app subnets reach the public endpoint via 0.0.0.0/0 → NAT Gateway, or via an interface VPC endpoint (com.amazonaws.<region>.events) with private DNS and no internet route.",
    nat: "Optional. Needed only for private-subnet producers without an interface endpoint. EventBridge delivering to targets does not use your NAT.",
    igw: "Not required. API destinations call external HTTPS APIs from the AWS network, not through your IGW; the IGW is involved only indirectly via the NAT Gateway for producers.",
    vpcOptional: "Optional: an interface VPC endpoint for the EventBridge API lets ECS tasks call PutEvents privately. API destinations can only reach publicly resolvable HTTPS endpoints, not private VPC IPs."
  },
  dataFlow: {
    in: [
      "PutEvents from ECS API tasks and Lambda: {source:'com.shop.orders', 'detail-type':'OrderPlaced', detail:{orderId, total, status}} onto the 'orders' bus.",
      "AWS service events on the default bus: ECS Task State Change, EC2 Instance State-change, Step Functions Execution Status Change, CloudWatch Alarm State Change, scheduled rule ticks.",
      "Partner SaaS events on partner buses and replayed events from an archive."
    ],
    out: [
      "Target invocations for every matching rule: Lambda Invoke, Step Functions StartExecution, SQS SendMessage, SNS Publish, ECS RunTask, event bus in another account/Region, API destination HTTPS calls.",
      "Events that exhaust the target's retry policy, sent to the target's SQS dead-letter queue.",
      "Metrics to CloudWatch: MatchedEvents, TriggeredRules, Invocations, FailedInvocations, ThrottledRules, DeadLetterInvocations, InvocationsFailedToBeSentToDlq."
    ]
  },
  networking: [
    "Producers call events.<region>.amazonaws.com over HTTPS 443; there is no inbound port on the bus.",
    "ECS tasks in private subnets need a NAT route or an interface VPC endpoint; a non-VPC Lambda producer needs nothing.",
    "Targets are invoked over the AWS network; ECS RunTask targets are launched into the subnets and security groups defined on the target (private app subnets, ecs-sg).",
    "API destinations call public HTTPS endpoints only; an on-premises or private API must be exposed through a public gateway or reached via a Lambda target inside the VPC.",
    "Cross-account and cross-Region delivery is bus-to-bus and needs no network setup, only bus resource policies."
  ],
  security: {
    iam: "Producers need events:PutEvents on the bus ARN (optionally conditioned on events:source and events:detail-type). Targets are authorized either by a resource-based policy on the target (Lambda, SQS, SNS, CloudWatch Logs) or by an IAM role on the rule target (Step Functions, Kinesis, ECS RunTask, API destinations, other buses).",
    securityGroups: "Not applicable to EventBridge itself; only producer egress, an optional interface endpoint ENI, and ECS RunTask targets carry security groups.",
    nacl: "Not applicable to the service; subnet NACLs affect only producers inside the VPC.",
    encryption: "TLS in transit. Events are encrypted at rest with an AWS-owned key by default; a customer managed KMS key is optional for custom event buses. API destination credentials are stored encrypted in Secrets Manager by the connection resource.",
    authentication: "SigV4-signed IAM principals for PutEvents; API destinations authenticate to the external API with Basic, API-key, or OAuth client-credentials connections.",
    authorization: "Bus resource policies control cross-account PutEvents and rule management; identity policies scope events:PutEvents to specific buses; target roles are scoped to the specific state machine or task definition.",
    secrets: "Never put secrets in event detail — every rule owner and the archive can read it. Keep external API credentials in the API destination connection, not in the event or the rule.",
    leastPrivilege: "A custom bus per domain so permissions are separable; producers limited to their own source values with events:source conditions; one target role per rule with a single action."
  },
  iam: [
    "ECS API task role: events:PutEvents on arn:aws:events:<region>:<account>:event-bus/orders, with Condition events:source = com.shop.orders.",
    "Rule target role (trust events.amazonaws.com) for the Step Functions target: states:StartExecution on the order-fulfillment state machine ARN; for ECS RunTask targets: ecs:RunTask plus iam:PassRole for the task and execution roles.",
    "Lambda targets: a resource-based policy statement allowing events.amazonaws.com lambda:InvokeFunction with aws:SourceArn = the rule ARN (Terraform aws_lambda_permission).",
    "SQS targets and DLQs: a queue policy allowing events.amazonaws.com sqs:SendMessage with aws:SourceArn = the rule ARN; SNS targets need the same on the topic policy; encrypted queues need the KMS key policy to allow events.amazonaws.com.",
    "EventBridge Scheduler needs its own execution role per schedule with the target action (ecs:RunTask, lambda:InvokeFunction, sqs:SendMessage)."
  ],
  scaling: [
    "PutEvents and target invocations have soft per-Region quotas (thousands of events per second) that AWS raises on request; the ECS API should retry with backoff on ThrottlingException or send events via a Lambda/SQS buffer.",
    "Rules per bus default to 300 (soft) and each rule has at most 5 targets — fan out to more consumers with several rules or an SNS/SQS target.",
    "Each target has its own throttling behaviour; EventBridge retries throttled invocations under the target's retry policy instead of dropping them.",
    "API destinations enforce a configurable invocation rate limit per second to protect the downstream API; excess events are retried.",
    "EventBridge Scheduler supports millions of schedules with flexible time windows to spread the load of bulk schedules."
  ],
  availability: [
    "Regional, multi-AZ managed service; events are durably stored before PutEvents returns success.",
    "At-least-once delivery with per-target retries (default up to 24 hours / 185 attempts) and an optional SQS dead-letter queue for exhausted events.",
    "Archives retain matching events (indefinitely or for a set period) and replays re-deliver them for a chosen time range.",
    "Global endpoints provide multi-Region failover for PutEvents using a Route 53 health check, with optional replication of events to a secondary Region's bus.",
    "Consumers must be idempotent (dedupe on the event id) because retries and replays can deliver the same event twice."
  ],
  cost: [
    "Custom events are billed per million published (each 64 KB chunk counts as one event); AWS service events on the default bus are free.",
    "Cross-account and cross-Region deliveries are billed as custom events; events that match no rule are still charged at publish.",
    "Schema discovery is billed per million events ingested (with a free monthly allowance); archive processing and storage per GB, replay per GB.",
    "API destination invocations, Scheduler invocations, and Pipes requests each have their own per-million pricing.",
    "Targets (Lambda, Step Functions, SQS) are billed separately by their own services."
  ],
  commonMistakes: [
    "Event pattern typos that never match: pattern values must be arrays (\"source\": [\"com.shop.orders\"]), keys are case-sensitive, and 'detail-type' is hyphenated.",
    "Matching numbers with string patterns; numeric fields need the numeric operator, and the producer must send a JSON number not a string.",
    "No DLQ on targets, so events that fail for 24 hours (a Lambda concurrency limit, a missing permission) vanish without trace.",
    "Missing SQS queue policy or Lambda resource policy for the target — FailedInvocations climb while the code looks fine.",
    "Putting application events on the default bus, mixing them with AWS service events and making permissions and archives hard to scope.",
    "Assuming ordering or exactly-once delivery; consumers that are not idempotent double-award loyalty points on retry.",
    "Writing scheduled rules in local time — rule cron expressions are UTC (EventBridge Scheduler supports time zones)."
  ],
  bestPractices: [
    "One custom bus per domain (orders, catalog) with a naming convention: source 'com.shop.<domain>', detail-type in PascalCase, a version field in detail.",
    "Attach an SQS DLQ to every target and alarm on DeadLetterInvocations and FailedInvocations.",
    "Add a catch-all rule on each custom bus that logs every event to CloudWatch Logs (short retention) for debugging, and an archive with 30–90 days retention for replay.",
    "Use input transformers to send targets only the fields they need; keep payloads small.",
    "Test event patterns with the console sandbox or 'aws events test-event-pattern' in CI.",
    "Register schemas (or enable discovery) and generate code bindings so producers and consumers share one contract.",
    "Prefer EventBridge Scheduler over scheduled rules for new schedules (time zones, one-time schedules, flexible windows, more targets)."
  ],
  creationSteps: [
    "Open the AWS Console and go to Amazon EventBridge → Event buses → Create event bus; name it 'orders' and click Create.",
    "Optionally open the bus → Archives → Create archive named 'orders-archive' with a pattern matching source 'com.shop.orders' and a 90-day retention.",
    "Go to Rules → Create rule; name it 'order-placed-to-fulfillment', choose the 'orders' bus, and rule type 'Rule with an event pattern'.",
    "Under Event pattern choose Custom pattern (JSON editor) and paste {\"source\":[\"com.shop.orders\"],\"detail-type\":[\"OrderPlaced\"]}; use the sandbox to test with a sample event.",
    "Add target 1: AWS service → Step Functions state machine → order-fulfillment; choose 'Create a new role for this specific resource'.",
    "Add target 2: Lambda function → loyalty-points (EventBridge adds the invoke permission automatically).",
    "For each target expand Additional settings: set Retry policy (maximum age 1 hour, 20 attempts) and select an SQS dead-letter queue.",
    "Click Create rule.",
    "In IAM, grant the ECS API task role events:PutEvents on the 'orders' bus ARN.",
    "Publish a test event with 'aws events put-events --entries' (source com.shop.orders, detail-type OrderPlaced) and check MatchedEvents, Invocations, and the Step Functions execution.",
    "Create an EventBridge Scheduler schedule (cron 0 2 * * ? * in your time zone) targeting the nightly reconciliation ECS task with its own execution role.",
    "Create CloudWatch alarms on FailedInvocations and DeadLetterInvocations for the rule and route them to the ops SNS topic."
  ],
  productionRecommendations: [
    "Custom bus per domain with a documented event envelope and schema registry entries.",
    "DLQ and tuned retry policy on every target; alarms on FailedInvocations/DeadLetterInvocations.",
    "Archive on the custom bus and a tested replay procedure.",
    "Producers get events:PutEvents scoped to one bus and source; target roles scoped to one action.",
    "Idempotent consumers keyed on the event id.",
    "Event patterns validated in CI with test-event-pattern; catch-all logging rule during onboarding."
  ],
  configExample: {
    title: "Terraform — custom bus, rule with JSON event pattern, Step Functions target with retry + DLQ",
    lang: "hcl",
    code: `resource "aws_cloudwatch_event_bus" "orders" { name = "orders" }

resource "aws_cloudwatch_event_rule" "order_placed" {
  name           = "order-placed-to-fulfillment"
  event_bus_name = aws_cloudwatch_event_bus.orders.name
  event_pattern = jsonencode({
    source        = ["com.shop.orders"]
    "detail-type" = ["OrderPlaced"]
    detail = {
      status  = ["CONFIRMED"]
      total   = [{ numeric = [">", 0] }]
      country = [{ prefix = "EU-" }]
    }
  })
}

resource "aws_cloudwatch_event_target" "fulfillment" {
  rule           = aws_cloudwatch_event_rule.order_placed.name
  event_bus_name = aws_cloudwatch_event_bus.orders.name
  target_id      = "order-fulfillment-sfn"
  arn            = aws_sfn_state_machine.order_fulfillment.arn
  role_arn       = aws_iam_role.eb_to_sfn.arn        # required: states:StartExecution
  retry_policy {
    maximum_event_age_in_seconds = 3600              # default 86400 (24 h)
    maximum_retry_attempts       = 20                # default 185
  }
  dead_letter_config { arn = aws_sqs_queue.eb_dlq.arn }  # queue policy must allow events.amazonaws.com
}`
  },
  productionChecklist: [
    "Application events on a custom bus, not the default bus.",
    "Event envelope convention (source, detail-type, version) documented; schemas registered.",
    "Every target has a DLQ and an explicit retry policy.",
    "Alarms on FailedInvocations, DeadLetterInvocations, ThrottledRules.",
    "Archive enabled on the custom bus; replay tested.",
    "Producers scoped with events:PutEvents + events:source condition.",
    "Target resource policies (Lambda, SQS, SNS) or target roles (Step Functions, ECS) in IaC.",
    "Consumers idempotent on event id.",
    "Patterns validated with test-event-pattern in CI.",
    "Schedules in EventBridge Scheduler with explicit time zones."
  ],
  dependencies: [
    { id: "iam", kind: "required", why: "PutEvents permissions, target roles, and target resource policies." },
    { id: "lambda", kind: "recommended", why: "The most common target for reacting to a business event (loyalty points to DynamoDB)." },
    { id: "step-functions", kind: "recommended", why: "OrderPlaced starts the fulfillment state machine via a rule target." },
    { id: "sqs", kind: "recommended", why: "Buffered targets and the dead-letter queue for every target." },
    { id: "cloudwatch", kind: "recommended", why: "Invocation metrics, alarms, and catch-all event logging." },
    { id: "ecs", kind: "optional", why: "The ECS API is the producer; RunTask is a target for scheduled jobs." },
    { id: "dynamodb", kind: "optional", why: "Where the Lambda consumer stores derived data such as loyalty balances." },
    { id: "vpc", kind: "optional", why: "An interface VPC endpoint for PutEvents from private subnets." },
    { id: "sns", kind: "alternative", why: "Plain fan-out to many subscribers or to email/SMS/push is cheaper and simpler with SNS." }
  ],
  related: ["sns", "sqs", "step-functions", "lambda", "cloudwatch"],
  ecommerceRole: "The 'orders' custom bus receives OrderPlaced from the ECS API and routes it to Lambda (loyalty points into DynamoDB), Step Functions (fulfillment saga), and an analytics SQS queue; the default bus turns ECS task-state and alarm events into operational automation, and Scheduler runs the nightly reconciliation task.",
  failure: {
    title: "An EventBridge target fails or a rule doesn't match",
    whatHappens: "Two different failures look the same to the consumer ('nothing happened'). (1) No rule matches: PutEvents still returns success and the event is dropped silently — no error, no per-event log; MatchedEvents simply does not increment. Typical causes are a scalar instead of an array in the pattern, a case mismatch, a numeric field sent as a string, or publishing to the wrong bus. (2) A target invocation fails (Lambda throttled, StartExecution denied, missing SQS queue policy, API destination returning 5xx): EventBridge retries with exponential backoff under the target's retry policy — by default for up to 24 hours and 185 attempts — while FailedInvocations increments; permanent errors such as access denied or resource not found are not retried. When the policy is exhausted the event goes to the target's SQS dead-letter queue if one is configured, otherwise it is discarded. Other targets on the same rule are independent, and once a target has accepted the event (Lambda queued it, SQS stored it) any later failure belongs to that service's own retry and DLQ behaviour.",
    awsMechanisms: [
      "Per-target retry policy (maximum event age and attempts) with exponential backoff.",
      "Per-target SQS dead-letter queue and the DeadLetterInvocations / InvocationsFailedToBeSentToDlq metrics.",
      "Archive and replay to re-deliver events after fixing the rule, the pattern, or the consumer.",
      "MatchedEvents, TriggeredRules, FailedInvocations, ThrottledRules metrics and the console sandbox / test-event-pattern API."
    ],
    mitigations: [
      "DLQ on every target with an alarm on depth; redrive from the DLQ after the fix.",
      "A catch-all rule on the custom bus that logs all events to CloudWatch Logs so a non-matching event is still visible.",
      "Pattern tests in CI and a shared schema so producers and rules stay in sync.",
      "Idempotent consumers, because retries and replays deliver duplicates."
    ]
  },
  beginnerConnectionHint: "The ECS API tells EventBridge 'an order was placed', and EventBridge looks at its rules and forwards the news to Lambda, Step Functions, and SQS — it also hears about things AWS itself does, like an ECS task stopping."
}, {
  id: "auto-scaling",
  name: "AWS Auto Scaling",
  shortName: "Auto Scaling",
  fullName: "Amazon EC2 Auto Scaling and Application Auto Scaling",
  category: "scaling",
  icon: "📈",
  tagline: "Automatically adds and removes EC2 instances and ECS tasks based on CloudWatch metrics",
  whatIsIt: "Auto Scaling is the family of AWS capabilities that adjust capacity automatically. Amazon EC2 Auto Scaling manages groups of EC2 instances (launching from a launch template, replacing unhealthy instances, and scaling on metrics or schedules). Application Auto Scaling does the same for other resources: the desired task count of an ECS service, DynamoDB provisioned throughput, Lambda provisioned concurrency, Aurora replicas, and more. Both are driven by CloudWatch metrics and alarms.",
  eli5: "Auto Scaling is the shop manager who watches the checkout line. When the line grows, they open more tills and call in more cashiers; when it is quiet, they close some so nobody stands around being paid for nothing. They also make sure at least two tills are always open on different sides of the shop, so if one side has a problem you can still pay, and if a cashier falls ill they bring in a replacement right away.",
  technical: "An EC2 Auto Scaling group (ASG) combines a launch template (AMI, instance type, security groups, IAM instance profile, user data) with a set of subnets across AZs and min/desired/max sizes; health checks (EC2 status and optionally ELB target health, after a grace period) trigger replacement; scaling policies are target tracking (ASGAverageCPUUtilization, ALBRequestCountPerTarget), step, simple, scheduled, or predictive; instance refresh rolls out new templates, lifecycle hooks and warm pools shape launch/termination. Application Auto Scaling registers a scalable target (for ECS: service/<cluster>/<service>, dimension ecs:service:DesiredCount, min/max) and applies target tracking (ECSServiceAverageCPUUtilization, ECSServiceAverageMemoryUtilization, ALBRequestCountPerTarget, or a custom metric), step scaling driven by your own CloudWatch alarms, or scheduled actions; target tracking creates and manages the alarms itself (scale out after 3 consecutive minutes above target, scale in after 15 minutes below).",
  whyUse: [
    "Handle traffic peaks (a flash sale, a TV advert) without permanently paying for peak capacity.",
    "Cut cost at night and on weekends by shrinking to the minimum automatically.",
    "Self-healing: unhealthy EC2 instances are terminated and replaced, keeping the group at desired capacity; ECS keeps the desired task count running.",
    "Keep capacity spread across Availability Zones so an AZ failure removes only a fraction of the fleet.",
    "Scale background workers on queue depth so the SQS backlog drains quickly after a burst and shrinks to almost nothing when idle."
  ],
  whenToUse: [
    "The ECS API service scaled on ALBRequestCountPerTarget or average CPU with min 2 tasks (one per AZ).",
    "The ECS SQS worker service scaled on backlog per task (ApproximateNumberOfMessagesVisible ÷ running tasks) with min 1–2 and max sized for the RDS connection budget.",
    "An EC2 Auto Scaling group for a legacy or self-managed tier (or as the capacity provider for ECS on EC2) behind the ALB with ELB health checks.",
    "Scheduled scaling before a known campaign (raise min at 08:55 before the 09:00 promotion) and predictive scaling for daily patterns.",
    "DynamoDB provisioned-capacity auto scaling and Lambda provisioned-concurrency scaling for predictable steady traffic."
  ],
  whenNotToUse: [
    "Lambda invocations and Fargate task launches do not need an ASG — Lambda scales concurrency automatically and Fargate is launched by ECS; use Application Auto Scaling only for the ECS service's task count.",
    "Stateful singletons such as the database: RDS uses Multi-AZ, read replicas, storage autoscaling, or Aurora Serverless instead of instance groups.",
    "Sub-minute spikes: metric delay plus alarm evaluation plus start-up means several minutes of lag — over-provision the minimum, buffer with SQS, or use Lambda.",
    "One-off or batch jobs: run them as ECS RunTask, AWS Batch, or a Step Functions Map instead of scaling a long-lived service.",
    "Instances with local state (session files, local caches) that cannot be terminated at will: make them stateless first or scaling in will lose data."
  ],
  placement: {
    scope: "regional",
    subnet: "n/a",
    internetAccessible: false,
    summary: "Auto Scaling is a regional control plane outside your VPC (autoscaling.<region>.amazonaws.com and application-autoscaling.<region>.amazonaws.com, IAM-authenticated). The resources it scales are inside the VPC: EC2 instances are launched into the private app subnets listed in the ASG, and ECS tasks are placed by the ECS service into its configured private subnets.",
    securityGroup: "Not applicable to Auto Scaling itself. The launch template defines the security group of new EC2 instances (allow the application port from the ALB security group only); ECS tasks inherit the service's security group.",
    nacl: "Not applicable to the control plane. The private app subnet NACLs must allow ALB traffic in and return traffic out for the instances and tasks that are launched there.",
    routeTable: "New instances and tasks use the private app route table (0.0.0.0/0 → NAT Gateway) for pulling images, packages, and calling AWS APIs; Auto Scaling itself needs no route.",
    nat: "Not needed by Auto Scaling. Launched EC2 instances and Fargate tasks in private subnets need the NAT Gateway (or VPC endpoints for ECR, S3, CloudWatch Logs) to pull images and boot.",
    igw: "Not required. Instances in private subnets have no public IP; only the ALB in the public subnets is internet-facing.",
    vpcOptional: "Optional: interface VPC endpoints exist for the autoscaling and application-autoscaling APIs if operators or tooling inside the VPC must call them without NAT; scaling actions themselves never require this."
  },
  dataFlow: {
    in: [
      "CloudWatch metrics and alarm state changes: ECS service CPU/memory, ALBRequestCountPerTarget, ASG average CPU, custom backlog-per-task metrics.",
      "Health signals: EC2 status checks and ALB target group health for ASG instances; ECS service events for task placement.",
      "Scheduled actions and predictive forecasts, plus manual changes to desired capacity by operators or deployment pipelines."
    ],
    out: [
      "EC2 RunInstances / TerminateInstances calls that add or remove instances in the ASG's subnets and register/deregister them with the ALB target group.",
      "UpdateService calls that change the ECS service's desired count (Application Auto Scaling), and capacity changes for DynamoDB tables or Lambda provisioned concurrency.",
      "Scaling activity history, GroupInServiceInstances/GroupDesiredCapacity metrics, and optional SNS notifications for launch/terminate events."
    ]
  },
  networking: [
    "Select private app subnets in at least two AZs for the ASG (VPCZoneIdentifier) and for the ECS service's awsvpc network configuration.",
    "Each Fargate task consumes one IP address in its subnet: size the app subnets so max task count × services fits (a /24 gives 251 usable addresses).",
    "Attach the ASG to the ALB target group so new instances receive traffic only after passing the target group health check; ECS does the same registration for tasks.",
    "The ALB target group deregistration delay (default 300 s) governs how long a scaled-in instance/task keeps serving in-flight requests; align it with the application's shutdown handling.",
    "New instances need outbound access (NAT or endpoints) to pull the ECS agent, container images from ECR, and to publish logs; otherwise they never become healthy."
  ],
  security: {
    iam: "Auto Scaling acts through service-linked roles (AWSServiceRoleForAutoScaling for EC2, AWSServiceRoleForApplicationAutoScaling_ECSService for ECS) that AWS creates automatically. Operators need autoscaling:* / application-autoscaling:* scoped to the group or service, plus iam:PassRole for the instance profile in the launch template.",
    securityGroups: "Auto Scaling has no security group. Launch templates pin the instance security group (inbound app port from alb-sg only); ECS services pin the task security group.",
    nacl: "Not applicable to the control plane; instances and tasks are subject to the private app subnet NACLs.",
    encryption: "Not applicable to the scaling API beyond TLS. Set EBS volume encryption in the launch template so every launched instance has encrypted disks; Fargate ephemeral storage is encrypted by default.",
    authentication: "SigV4 IAM for all API calls; CloudWatch alarms act on Auto Scaling through the service-linked role, not through user credentials.",
    authorization: "Restrict who can change min/max/desired and launch templates (a wrong max is a cost incident); use autoscaling:ResourceTag conditions to separate teams.",
    secrets: "Launch template user data is readable by anyone with ec2:DescribeLaunchTemplateVersions — never embed credentials; fetch them at boot from SSM Parameter Store or Secrets Manager via the instance profile.",
    leastPrivilege: "Instance profiles carry only what the workload needs (ECR pull, CloudWatch Logs, SSM); deployment pipelines get autoscaling:UpdateAutoScalingGroup / application-autoscaling:RegisterScalableTarget on named resources only."
  },
  iam: [
    "Service-linked roles: AWSServiceRoleForAutoScaling (EC2 Auto Scaling) and AWSServiceRoleForApplicationAutoScaling_ECSService are created automatically the first time you use each service; iam:CreateServiceLinkedRole is needed once.",
    "Launch template instance profile: AmazonSSMManagedInstanceCore, ECR read (if running containers), CloudWatch agent permissions; the operator creating the template needs iam:PassRole on that profile.",
    "Operators/CI: autoscaling:CreateAutoScalingGroup, UpdateAutoScalingGroup, PutScalingPolicy, StartInstanceRefresh; application-autoscaling:RegisterScalableTarget, PutScalingPolicy, PutScheduledAction — scoped by resource ARN or tags.",
    "Step scaling policies use CloudWatch alarms you create; the alarm's action is the policy ARN and no extra permission is needed because the service-linked role performs the scaling.",
    "Optional: an SNS topic policy allowing the ASG's service-linked role / autoscaling.amazonaws.com to publish launch and terminate notifications."
  ],
  scaling: [
    "Target tracking computes desired capacity so the metric returns to the target (for example CPU 60%): it scales out proportionally to how far the metric is above target and scales in conservatively.",
    "Step scaling adds a fixed or percentage amount per alarm breach range; scheduled scaling changes min/max/desired at set times; predictive scaling (EC2) forecasts daily patterns from historical load.",
    "Scale-out cooldown / instance warm-up prevents counting a still-booting instance or task as capacity; scale-in cooldown (typically 300 s) prevents flapping.",
    "Several policies may coexist; when they disagree, Auto Scaling picks the policy that yields the largest capacity.",
    "Hard ceilings apply: max capacity, EC2 vCPU service quotas, Fargate quotas, subnet IP addresses, and the RDS connection budget of the scaled tier."
  ],
  availability: [
    "min ≥ 2 spread across ≥ 2 AZs guarantees that an AZ outage or a single unhealthy instance never takes the tier to zero; Auto Scaling launches replacements in the remaining AZs.",
    "ASGs rebalance instances across AZs and replace instances failing EC2 or ELB health checks; the ECS scheduler replaces tasks that fail ALB health checks.",
    "Set max ≥ 2× the steady state so a single AZ can host the full load when the other is unavailable (N+1 sizing).",
    "Instance scale-in protection and ECS task scale-in protection stop Auto Scaling from terminating an instance/task in the middle of a long job.",
    "Instance refresh and ECS rolling deployments replace capacity gradually (minimum healthy percentage) so an upgrade never drops below the safe floor."
  ],
  cost: [
    "Auto Scaling itself is free; you pay for the EC2 instances, Fargate tasks, DynamoDB capacity, or provisioned concurrency it launches.",
    "CloudWatch alarms created for step and target-tracking policies are billed as standard alarms; EC2 detailed (1-minute) monitoring is a small per-instance charge that makes scaling react faster.",
    "Scaling in too slowly or setting the minimum too high wastes money; setting it too low costs availability — tune target values with real load tests.",
    "Mixed instances policies with Spot capacity cut EC2 cost by 60–90% for stateless tiers; Fargate Spot does the same for interruptible ECS tasks.",
    "Warm pools keep pre-initialized (stopped) instances whose EBS volumes are still billed; predictive scaling pre-launches capacity you pay for before the traffic arrives."
  ],
  commonMistakes: [
    "min = 1 or all instances in one AZ; a single failure or AZ event takes the service down and the ASG must launch from scratch.",
    "ASG health check type left at EC2 only, so an instance that serves HTTP 500s but passes status checks is never replaced — enable ELB health checks.",
    "Health check grace period shorter than the boot time, causing every new instance to be marked unhealthy and replaced in a loop.",
    "Scaling on average CPU for an I/O- or memory-bound application; the metric never moves while latency explodes.",
    "Scaling in a worker mid-message with no graceful shutdown (ECS stopTimeout, SIGTERM handling) or task scale-in protection, producing duplicate or lost work.",
    "max too low for the real peak (or Fargate/vCPU quotas and subnet IPs too small), so capacity silently caps while the ALB returns 5xx.",
    "Editing desired capacity by hand and being surprised when the policy reverts it minutes later."
  ],
  bestPractices: [
    "min ≥ 2 across two or more AZs, max ≥ 2× expected peak, and a load test that proves the target value keeps p99 latency acceptable.",
    "Use target tracking as the default (ECS CPU 50–60% or ALBRequestCountPerTarget); add step or scheduled scaling only for known patterns.",
    "Enable ELB health checks on the ASG with a realistic grace period; use ALB health checks with short intervals for ECS.",
    "Make scale-in safe: ALB deregistration delay, ECS stopTimeout and SIGTERM handling, and task scale-in protection for long jobs.",
    "Scale SQS workers on backlog per task (custom metric) rather than CPU, and cap max by the RDS connection budget (use RDS Proxy).",
    "Roll out AMI/launch template changes with instance refresh (minimum healthy 90%) and ECS rolling deployments with circuit breaker.",
    "Alarm when GroupInServiceInstances < GroupDesiredCapacity or RunningTaskCount < DesiredCount for more than 10 minutes, and on capacity errors in the activity history."
  ],
  creationSteps: [
    "For the ECS API service: open the Amazon ECS console → Clusters → shop-cluster → Services → shop-api → Update service.",
    "Expand Service auto scaling, tick 'Use service auto scaling', and set Minimum tasks 2 and Maximum tasks 12.",
    "Add a scaling policy: type Target tracking, name 'cpu-60', metric ECSServiceAverageCPUUtilization, target value 60, scale-out cooldown 60 s, scale-in cooldown 300 s.",
    "Add a second target tracking policy 'req-per-target' on ALBRequestCountPerTarget with target 800 requests per task per minute and click Update.",
    "For the SQS worker service: repeat with min 1, max 20, and a target tracking policy on a custom backlog-per-task metric published by a small Lambda or the worker itself.",
    "For an EC2 tier: open the EC2 console → Launch Templates → Create launch template with the AMI, instance type, app security group, instance profile, encrypted EBS, and user data.",
    "Go to Auto Scaling Groups → Create Auto Scaling group, select the launch template, choose the VPC and the two private app subnets.",
    "Attach to an existing ALB target group, set health check type ELB with a 300 s grace period, and enable group metrics collection.",
    "Set group size: desired 2, minimum 2, maximum 6; add a target tracking policy on Average CPU utilization at 50% with a 300 s instance warm-up.",
    "Add SNS notifications for launch/terminate/failed events and tags (Name, Environment) that propagate to instances; click Create Auto Scaling group.",
    "Watch the Activity tab until both instances are InService and healthy in the target group.",
    "Create CloudWatch alarms for in-service instances below desired and for ECS RunningTaskCount below DesiredCount, routed to the ops SNS topic."
  ],
  productionRecommendations: [
    "Minimum capacity of 2 across two AZs for every internet-facing tier; N+1 headroom in max.",
    "Target tracking with load-tested targets; scheduled pre-scaling for known campaigns.",
    "ELB health checks on ASGs; graceful shutdown and scale-in protection for workers.",
    "Instance refresh / rolling deployments for every template change — no manual instance edits.",
    "Alarms on desired vs in-service capacity and on scaling failures in the activity history.",
    "Quotas (vCPU, Fargate tasks) and subnet IP space verified against max capacity."
  ],
  configExample: {
    title: "Terraform — Application Auto Scaling for the ECS API service (CPU + requests per target)",
    lang: "hcl",
    code: `resource "aws_appautoscaling_target" "api" {
  service_namespace  = "ecs"
  resource_id        = "service/shop-cluster/shop-api"      # service/<cluster>/<service>
  scalable_dimension = "ecs:service:DesiredCount"
  min_capacity       = 2                                    # one task per AZ minimum
  max_capacity       = 12
}

resource "aws_appautoscaling_policy" "api_cpu" {
  name               = "shop-api-cpu-60"
  policy_type        = "TargetTrackingScaling"
  service_namespace  = aws_appautoscaling_target.api.service_namespace
  resource_id        = aws_appautoscaling_target.api.resource_id
  scalable_dimension = aws_appautoscaling_target.api.scalable_dimension
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification { predefined_metric_type = "ECSServiceAverageCPUUtilization" }
    target_value       = 60
    scale_out_cooldown = 60     # react quickly to load
    scale_in_cooldown  = 300    # release capacity slowly
  }
}

# Optional second policy: TargetTrackingScaling on ALBRequestCountPerTarget with
# resource_label = "app/<alb-name>/<alb-id>/targetgroup/<tg-name>/<tg-id>" and e.g. target_value = 800.
# When several policies disagree, Application Auto Scaling applies the one that yields the most capacity.`
  },
  productionChecklist: [
    "Minimum capacity ≥ 2 across ≥ 2 AZs for API and worker tiers.",
    "Maximum capacity covers peak with N+1 headroom and fits quotas and subnet IPs.",
    "Target tracking policies with load-tested target values.",
    "ELB health checks (ASG) / ALB health checks (ECS) with correct grace period.",
    "Graceful shutdown: deregistration delay, stopTimeout, SIGTERM handling, scale-in protection for long jobs.",
    "Worker scaling on backlog per task; max bounded by RDS connections (RDS Proxy in place).",
    "Scheduled scaling for known peaks configured.",
    "Instance refresh / rolling deployment strategy defined; no manual capacity edits.",
    "Alarms on in-service < desired and on scaling failures; SNS notifications for ASG events.",
    "Launch templates encrypt EBS and contain no secrets in user data."
  ],
  dependencies: [
    { id: "cloudwatch", kind: "required", why: "Every scaling decision comes from CloudWatch metrics and alarms." },
    { id: "iam", kind: "required", why: "Service-linked roles, the instance profile in the launch template, and operator permissions." },
    { id: "subnets", kind: "required", why: "Capacity is launched into private app subnets across at least two AZs." },
    { id: "ecs", kind: "recommended", why: "Application Auto Scaling adjusts the desired count of the API and worker services." },
    { id: "ec2", kind: "recommended", why: "EC2 Auto Scaling groups manage instance fleets for EC2-based tiers." },
    { id: "alb", kind: "recommended", why: "ELB health checks and the ALBRequestCountPerTarget metric; new capacity registers with the target group." },
    { id: "security-groups", kind: "recommended", why: "The launch template / ECS service pins the security group every new instance or task receives." },
    { id: "sqs", kind: "optional", why: "Queue depth drives worker scaling via a backlog-per-task metric." },
    { id: "sns", kind: "optional", why: "Launch/terminate notifications and alarm routing." },
    { id: "dynamodb", kind: "optional", why: "Provisioned read/write capacity can be auto scaled with the same service." },
    { id: "lambda", kind: "alternative", why: "Lambda scales concurrency itself; no scaling group is needed for function-based tiers." }
  ],
  related: ["ecs", "ec2", "alb", "cloudwatch", "sqs", "lambda"],
  ecommerceRole: "Keeps the ECS API service sized to traffic (CPU / requests per target, min 2 tasks across both AZs), grows the SQS worker service when the job backlog rises, and manages any EC2 Auto Scaling group behind the ALB — all triggered by CloudWatch alarms.",
  failure: {
    title: "Auto Scaling cannot launch capacity / scaling lags behind load",
    whatHappens: "Two related problems. (1) Launch failures: an AZ reports InsufficientInstanceCapacity, the account hits its vCPU or Fargate quota, the subnet runs out of IP addresses, the launch template references a bad AMI, or new tasks crash-loop and fail health checks. The ASG records a failed activity and keeps retrying (trying other AZs and, with a mixed instances policy, other instance types); the ECS service logs 'unable to place a task' or 'unable to consistently start tasks' events. Desired capacity stays above in-service capacity while the existing instances or tasks absorb all the load. (2) Lag: even when launches succeed, a spike must first show up in a metric (about a minute), breach the alarm for 3 consecutive minutes, and then the new task must pull its image, boot, and pass ALB health checks — typically 3–6 minutes end to end. During that window the existing tasks saturate, latency climbs, the ALB returns 5xx (503 when no healthy target remains), and if the tier scales out aggressively it can also exhaust RDS connections.",
    awsMechanisms: [
      "ASG retries launches across AZs; mixed instances policies and attribute-based instance selection widen the pool; capacity rebalancing handles Spot interruptions.",
      "Health-check replacement of unhealthy instances and ECS scheduler retries for failed task placement.",
      "Predictive and scheduled scaling plus EC2 warm pools pre-provision capacity before the demand arrives.",
      "Activity history, ECS service events, CloudWatch metrics (GroupInServiceInstances vs GroupDesiredCapacity, RunningTaskCount vs DesiredCount) and Service Quotas for visibility."
    ],
    mitigations: [
      "Run with headroom: min ≥ 2 per AZ pair, target 50–60% utilization, and scheduled pre-scaling for known events.",
      "Allow several instance types/sizes and both AZs; request quota increases and size subnets before peak season.",
      "Alarm on in-service < desired and on RunningTaskCount < DesiredCount; alarm on placement failures in ECS events.",
      "Shorten the lag: small container images, fast readiness endpoints, 1-minute metrics, and an SQS buffer so bursts wait in the queue instead of failing."
    ]
  },
  beginnerConnectionHint: "CloudWatch tells Auto Scaling 'the ECS tasks are busy' or 'the SQS queue is long', and Auto Scaling asks ECS or EC2 to start more copies in the private subnets behind the ALB — then removes them again when things calm down."
});
