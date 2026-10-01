/* Architecture Path Mode + request-flow animation. Steps reference canvas instance ids
   from the production layout; `service` links the explanation to a node's panel. */
window.AWS_PATHS = [
  { id: "request-to-db", title: "How does a request reach the database?", question: "A shopper opens /products and the API reads from RDS.",
    steps: [
      { inst: "users", service: null, title: "Shopper's browser", tech: "DNS (Route 53 or any provider) resolves shop.example.com to the CloudFront distribution. The browser opens a TLS connection to the nearest edge.", eli5: "You type the shop's name and your browser finds the nearest helper." },
      { inst: "cloudfront", service: "cloudfront", title: "CloudFront edge", tech: "Cache miss for /api/products (dynamic). The behavior for /api/* forwards to the ALB origin over HTTPS with a secret origin header; WAF rules run here.", eli5: "The helper doesn't have this answer saved, so it runs to the shop's front door." },
      { inst: "igw", service: "igw", title: "Internet Gateway", tech: "The request enters the VPC through the IGW toward the ALB node's public IP in a public subnet (public route table 0.0.0.0/0 → igw).", eli5: "The request walks in through the front gate." },
      { inst: "alb", service: "alb", title: "Application Load Balancer", tech: "TLS terminates (ACM cert). alb-sg allows 443 only from CloudFront's prefix list. Listener rule /api/* → target group; a healthy ECS task IP in either AZ is chosen.", eli5: "The receptionist checks the visitor came via the helper, then picks a free worker." },
      { inst: "ecs-a", service: "ecs", title: "ECS task (private app subnet)", tech: "Task receives HTTP on :8080 (ecs-sg allows 8080 from alb-sg). The API validates the shopper's JWT, then opens a pooled connection to the RDS endpoint using credentials from Secrets Manager.", eli5: "The worker checks your ticket and walks to the back room for the list of toys." },
      { inst: "rds-primary", service: "rds", title: "RDS primary (private DB subnet)", tech: "rds-sg allows 5432 only from ecs-sg. The database route table has only the local route — no internet path. SELECT runs; result returns over the same TCP connection.", eli5: "The locked back room hands over the list. Only workers can open this door." },
      { inst: "alb", service: "alb", title: "Response path", tech: "JSON response flows back task → ALB → CloudFront → browser. Security groups are stateful, so no extra rules are needed for the reply. RDS also emits query metrics to CloudWatch.", eli5: "The answer travels back the same way, and the control room writes down how long it took." }
    ] },
  { id: "background-job", title: "How does a background job work?", question: "Checkout succeeded; the invoice email must be sent without slowing the response.",
    steps: [
      { inst: "ecs-a", service: "ecs", title: "API task enqueues a job", tech: "After committing the order in RDS, the API calls sqs:SendMessage (task role permission) with {orderId}. The HTTP response returns immediately.", eli5: "The worker writes 'send Sam an invoice' on a slip and drops it in the to-do box." },
      { inst: "sqs", service: "sqs", title: "SQS queue", tech: "Message stored durably (up to 14 days). Reached via an interface endpoint or NAT — SQS is outside the VPC.", eli5: "The slip waits safely in the box." },
      { inst: "worker-b", service: "ecs", title: "ECS worker service", tech: "Worker long-polls ReceiveMessage. The message becomes invisible for the visibility timeout while it is processed.", eli5: "Another worker checks the box, takes the slip, and starts the job." },
      { inst: "rds-primary", service: "rds", title: "Worker reads order details", tech: "Worker queries RDS for the order lines (same SG chain: worker task uses ecs-sg). Generates the PDF and stores it in S3.", eli5: "The worker looks up the order in the back room and prints the invoice." },
      { inst: "sns", service: "sns", title: "Notify the customer", tech: "Worker publishes to the notifications topic; SNS delivers the email. Then the worker calls sqs:DeleteMessage. If it had crashed, the message would reappear and be retried; after 5 failures it lands in the DLQ (alarmed).", eli5: "The worker rings the bell so the mail goes out, then throws away the slip. If they had dropped it, the slip would pop back into the box." }
    ] },
  { id: "event-trigger", title: "How does an event trigger processing?", question: "OrderPlaced should update analytics and start fulfillment without the API knowing who listens.",
    steps: [
      { inst: "ecs-b", service: "ecs", title: "API publishes a business event", tech: "events:PutEvents to the custom bus with detail-type 'OrderPlaced' and the order JSON. The producer has no knowledge of consumers.", eli5: "The worker shouts 'new order!' into the loudspeaker." },
      { inst: "eventbridge", service: "eventbridge", title: "EventBridge rules match", tech: "Rule A: detail-type OrderPlaced → Lambda analytics function. Rule B: same event → Step Functions StartExecution. Each target has a retry policy and a DLQ.", eli5: "The mail sorter reads the shout and delivers it to everyone whose rule says 'I care about new orders'." },
      { inst: "lambda", service: "lambda", title: "Lambda analytics handler", tech: "Invoked asynchronously; the execution role allows dynamodb:UpdateItem on the metrics table only. Failures retry twice, then go to the on-failure destination.", eli5: "A robot wakes up to update the scoreboard." },
      { inst: "dynamodb", service: "dynamodb", title: "DynamoDB counter update", tech: "Atomic ADD on the product's daily view/order counter. Idempotency key = event id, so retries do not double count.", eli5: "The scoreboard on the sticky-note wall goes up by one." },
      { inst: "step-functions", service: "step-functions", title: "Fulfillment workflow", tech: "Reserve inventory → charge payment → create shipment → publish OrderShipped to SNS. Each Task state has Retry/Catch; a failed payment triggers a compensating 'release inventory' step.", eli5: "A checklist makes sure every packing step happens in order, and undoes earlier steps if one fails." }
    ] },
  { id: "static-asset", title: "How is a product image served?", question: "The browser requests /images/shoe-123.jpg.",
    steps: [
      { inst: "users", service: null, title: "Browser requests the image", tech: "Same CloudFront domain; the /images/* behavior points at the S3 origin.", eli5: "You ask for a picture of the shoe." },
      { inst: "cloudfront", service: "cloudfront", title: "Edge cache", tech: "Cache hit: served in milliseconds from the edge. Cache miss: CloudFront fetches from S3 using Origin Access Control (SigV4) and caches with the object's Cache-Control TTL.", eli5: "The helper already has the picture; if not, it fetches it from the locked box." },
      { inst: "s3", service: "s3", title: "S3 bucket (private)", tech: "Bucket policy allows s3:GetObject only for this distribution's service principal. Block Public Access is on. Objects were uploaded by the ECS API or via presigned URLs.", eli5: "The box opens only for the helper with the key." }
    ] },
  { id: "outbound-call", title: "How does a private task call an external API?", question: "The API needs to charge a card at the payment provider.",
    steps: [
      { inst: "ecs-a", service: "ecs", title: "Task opens HTTPS to payments.example", tech: "Task has only a private IP (10.0.11.x). Private route table: 0.0.0.0/0 → NAT Gateway in the same AZ.", eli5: "The worker needs to phone the bank but has no outside line of their own." },
      { inst: "nat-a", service: "nat-gateway", title: "NAT Gateway (public subnet)", tech: "Rewrites the source to its Elastic IP, tracks the connection, and forwards via the public route table (0.0.0.0/0 → IGW). The provider sees the NAT's static IP — useful for allow-listing.", eli5: "The back door lets the worker out and remembers who went out so the answer comes back to them." },
      { inst: "igw", service: "igw", title: "Internet Gateway → internet", tech: "Reply packets return to the NAT, which maps them back to the task. Nothing from the internet can initiate a connection to the task.", eli5: "Out through the front gate to the bank and back again; strangers still can't get in." }
    ] }
];

/* Request-flow animation for GET https://example.com/products (includes optional Route 53) */
window.AWS_REQUEST_FLOW = {
  url: "https://shop.example.com/products",
  steps: [
    { id: "dns", inst: null, icon: "🔎", title: "Route 53 (optional) — DNS lookup", service: null, tech: "The browser asks DNS for shop.example.com. If you host DNS in Route 53, an alias record answers with the CloudFront distribution's IPs. Any DNS provider works; Route 53 adds health checks and routing policies.", eli5: "Your browser asks 'where does the shop live?' and gets the address of the nearest helper.", time: "~20–50 ms (cached after first lookup)" },
    { id: "cf", inst: "cloudfront", icon: "🌍", title: "CloudFront edge", service: "cloudfront", tech: "TLS handshake at the edge. WAF evaluates the request. /products is HTML from the SPA → served from cache (S3 origin). The SPA then calls /api/products, which is a cache-miss behavior forwarded to the ALB.", eli5: "The helper gives you the page instantly and runs to the shop for the fresh product list.", time: "~5–30 ms cache hit" },
    { id: "alb", inst: "alb", icon: "⚖️", title: "ALB (public subnet)", service: "alb", tech: "Enters the VPC via the IGW. alb-sg checks the source is CloudFront. Listener 443 → rule /api/* → target group → healthy task by round robin across both AZs.", eli5: "The receptionist picks a free worker.", time: "~1–3 ms" },
    { id: "ecs", inst: "ecs-a", icon: "📦", title: "ECS task (private app subnet)", service: "ecs", tech: "Node/Express container on :8080 validates the JWT, checks DynamoDB for the shopper's cart badge count (optional), and queries RDS for the product list with pagination.", eli5: "The worker checks your ticket and goes to fetch the list.", time: "~5–20 ms app logic" },
    { id: "rds", inst: "rds-primary", icon: "🗄️", title: "RDS PostgreSQL (private DB subnet)", service: "rds", tech: "SELECT … FROM products WHERE … LIMIT 24 using an index. Connection came from the task's pool. Metrics emitted to CloudWatch.", eli5: "The back room hands over the list.", time: "~1–10 ms indexed query" },
    { id: "resp", inst: "cloudfront", icon: "↩️", title: "Response", service: null, tech: "JSON travels task → ALB → CloudFront → browser. Stateful security groups allow the reply automatically. ALB and CloudFront both log the request; CloudWatch records TargetResponseTime.", eli5: "The answer comes back the same way and the control room notes how long it took.", time: "Total typically 50–150 ms" }
  ]
};
