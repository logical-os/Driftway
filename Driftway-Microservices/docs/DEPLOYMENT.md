# Deployment Guide

This guide covers deploying Driftway microservices in various environments from development to production.

## Deployment Options

1. **Local Development** - Docker Compose on developer machine
2. **Staging Environment** - Single-node deployment for testing
3. **Production** - Multi-node Kubernetes cluster with high availability
4. **Cloud Platforms** - AWS, GCP, Azure specific deployments

## Prerequisites

### Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM, 20GB storage

### Kubernetes Deployment
- Kubernetes 1.24+
- kubectl configured for your cluster
- Helm 3.0+ (optional but recommended)
- Ingress controller (nginx, traefik, etc.)

### Production Requirements
- Load balancer (external)
- SSL certificates
- Domain name
- Monitoring solution (Prometheus + Grafana)
- Log aggregation (ELK stack)

## Local Development Deployment

### Quick Start with Docker Compose

1. **Clone and navigate to project**:
   ```bash
   git clone <repository-url>
   cd Driftway-Microservices
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Start all services**:
   ```bash
   docker-compose up -d
   ```

4. **Verify deployment**:
   ```bash
   docker-compose ps
   curl http://localhost:8080/health
   ```

### Custom Configuration

Edit `docker-compose.yml` for local customization:

```yaml
version: '3.8'
services:
  api-gateway:
    environment:
      - DEBUG=true
      - LOG_LEVEL=debug
    ports:
      - "8080:8080"
    
  text-channels:
    environment:
      - MIX_ENV=dev
    ports:
      - "4000:4000"
    
  voice-channels:
    environment:
      - LOG_LEVEL=debug
    ports:
      - "9090:9090"
```

## Staging Environment Deployment

### Single-Node Docker Deployment

1. **Prepare staging server**:
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Create staging configuration**:
   ```bash
   # staging.env
   ENVIRONMENT=staging
   DEBUG=false
   LOG_LEVEL=info
   
   # Database
   MONGO_URI=mongodb://mongodb:27017/driftway_staging
   REDIS_URL=redis://redis:6379
   
   # Security
   JWT_SECRET=staging-jwt-secret-change-in-production
   
   # Domain
   DOMAIN=staging.driftway.com
   ```

3. **Deploy with staging compose**:
   ```bash
   # docker-compose.staging.yml
   version: '3.8'
   services:
     api-gateway:
       image: driftway/api-gateway:staging
       environment:
         - ENVIRONMENT=staging
       restart: unless-stopped
       
     nginx:
       volumes:
         - ./nginx/staging.conf:/etc/nginx/nginx.conf
         - /etc/letsencrypt:/etc/nginx/ssl
   ```

4. **Start staging environment**:
   ```bash
   docker-compose -f docker-compose.staging.yml up -d
   ```

### SSL Configuration for Staging

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Generate SSL certificate**:
   ```bash
   sudo certbot --nginx -d staging.driftway.com
   ```

3. **Update Nginx configuration**:
   ```nginx
   # nginx/staging.conf
   server {
       listen 443 ssl;
       server_name staging.driftway.com;
       
       ssl_certificate /etc/letsencrypt/live/staging.driftway.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/staging.driftway.com/privkey.pem;
       
       location / {
           proxy_pass http://api-gateway:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## Production Kubernetes Deployment

### Kubernetes Manifests

#### Namespace
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: driftway
  labels:
    name: driftway
```

#### ConfigMap
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: driftway-config
  namespace: driftway
data:
  ENVIRONMENT: "production"
  LOG_LEVEL: "info"
  REDIS_URL: "redis://redis-service:6379"
  MONGO_URI: "mongodb://mongodb-service:27017/driftway"
```

#### Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: driftway-secrets
  namespace: driftway
type: Opaque
data:
  jwt-secret: <base64-encoded-secret>
  mongo-password: <base64-encoded-password>
  redis-password: <base64-encoded-password>
```

#### MongoDB Deployment
```yaml
# k8s/mongodb.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mongodb
  namespace: driftway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:7.0
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: driftway-secrets
              key: mongo-password
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
      volumes:
      - name: mongodb-data
        persistentVolumeClaim:
          claimName: mongodb-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: mongodb-service
  namespace: driftway
spec:
  selector:
    app: mongodb
  ports:
  - port: 27017
    targetPort: 27017
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: driftway
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
```

#### Redis Deployment
```yaml
# k8s/redis.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: driftway
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command: ["redis-server", "--requirepass", "$(REDIS_PASSWORD)"]
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: driftway-secrets
              key: redis-password
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: driftway
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

#### API Gateway Deployment
```yaml
# k8s/api-gateway.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: driftway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: driftway/api-gateway:latest
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: driftway-config
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: driftway-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: driftway
spec:
  selector:
    app: api-gateway
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
```

#### Text Channels Deployment
```yaml
# k8s/text-channels.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: text-channels
  namespace: driftway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: text-channels
  template:
    metadata:
      labels:
        app: text-channels
    spec:
      containers:
      - name: text-channels
        image: driftway/text-channels:latest
        ports:
        - containerPort: 4000
        envFrom:
        - configMapRef:
            name: driftway-config
        env:
        - name: SECRET_KEY_BASE
          valueFrom:
            secretKeyRef:
              name: driftway-secrets
              key: phoenix-secret
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: text-channels-service
  namespace: driftway
spec:
  selector:
    app: text-channels
  ports:
  - port: 4000
    targetPort: 4000
```

#### Voice Channels Deployment
```yaml
# k8s/voice-channels.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voice-channels
  namespace: driftway
spec:
  replicas: 2
  selector:
    matchLabels:
      app: voice-channels
  template:
    metadata:
      labels:
        app: voice-channels
    spec:
      containers:
      - name: voice-channels
        image: driftway/voice-channels:latest
        ports:
        - containerPort: 9090
        - containerPort: 3478
          protocol: UDP
        envFrom:
        - configMapRef:
            name: driftway-config
        livenessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 9090
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: voice-channels-service
  namespace: driftway
spec:
  selector:
    app: voice-channels
  ports:
  - name: http
    port: 9090
    targetPort: 9090
  - name: webrtc
    port: 3478
    targetPort: 3478
    protocol: UDP
```

#### Ingress Configuration
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: driftway-ingress
  namespace: driftway
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - api.driftway.com
    secretName: driftway-tls
  rules:
  - host: api.driftway.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-service
            port:
              number: 8080
```

### Deploy to Kubernetes

1. **Apply manifests**:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   kubectl apply -f k8s/mongodb.yaml
   kubectl apply -f k8s/redis.yaml
   kubectl apply -f k8s/api-gateway.yaml
   kubectl apply -f k8s/text-channels.yaml
   kubectl apply -f k8s/voice-channels.yaml
   kubectl apply -f k8s/ingress.yaml
   ```

2. **Verify deployment**:
   ```bash
   kubectl get pods -n driftway
   kubectl get services -n driftway
   kubectl logs -f deployment/api-gateway -n driftway
   ```

3. **Check ingress**:
   ```bash
   kubectl get ingress -n driftway
   curl -k https://api.driftway.com/health
   ```

## Helm Deployment (Recommended for Production)

### Create Helm Chart

1. **Initialize Helm chart**:
   ```bash
   helm create driftway
   ```

2. **Edit values.yaml**:
   ```yaml
   # helm/driftway/values.yaml
   global:
     domain: driftway.com
     environment: production
   
   apiGateway:
     image:
       repository: driftway/api-gateway
       tag: "latest"
     replicaCount: 3
     resources:
       requests:
         memory: "128Mi"
         cpu: "100m"
       limits:
         memory: "512Mi"
         cpu: "500m"
   
   textChannels:
     image:
       repository: driftway/text-channels
       tag: "latest"
     replicaCount: 3
     resources:
       requests:
         memory: "256Mi"
         cpu: "200m"
       limits:
         memory: "1Gi"
         cpu: "1000m"
   
   voiceChannels:
     image:
       repository: driftway/voice-channels
       tag: "latest"
     replicaCount: 2
     resources:
       requests:
         memory: "512Mi"
         cpu: "500m"
       limits:
         memory: "2Gi"
         cpu: "2000m"
   
   mongodb:
     enabled: true
     persistence:
       size: 100Gi
   
   redis:
     enabled: true
   
   ingress:
     enabled: true
     className: nginx
     tls:
       enabled: true
   ```

3. **Deploy with Helm**:
   ```bash
   helm install driftway ./helm/driftway -n driftway --create-namespace
   ```

4. **Upgrade deployment**:
   ```bash
   helm upgrade driftway ./helm/driftway -n driftway
   ```

## Cloud Platform Deployments

### AWS EKS Deployment

1. **Create EKS cluster**:
   ```bash
   eksctl create cluster \
     --name driftway-cluster \
     --region us-west-2 \
     --nodes 3 \
     --node-type m5.large \
     --with-oidc \
     --managed
   ```

2. **Install AWS Load Balancer Controller**:
   ```bash
   kubectl apply -k "github.com/aws/eks-charts/stable/aws-load-balancer-controller//crds?ref=master"
   helm repo add eks https://aws.github.io/eks-charts
   helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
     -n kube-system \
     --set clusterName=driftway-cluster
   ```

3. **Configure RDS for MongoDB**:
   ```bash
   # Use Amazon DocumentDB for MongoDB compatibility
   aws docdb create-db-cluster \
     --db-cluster-identifier driftway-docdb \
     --engine docdb \
     --master-username admin \
     --master-user-password <password>
   ```

4. **Configure ElastiCache for Redis**:
   ```bash
   aws elasticache create-cache-cluster \
     --cache-cluster-id driftway-redis \
     --cache-node-type cache.r6g.large \
     --engine redis \
     --num-cache-nodes 1
   ```

### Google GKE Deployment

1. **Create GKE cluster**:
   ```bash
   gcloud container clusters create driftway-cluster \
     --zone us-central1-a \
     --num-nodes 3 \
     --machine-type n1-standard-2 \
     --enable-autoscaling \
     --min-nodes 1 \
     --max-nodes 10
   ```

2. **Configure Cloud SQL**:
   ```bash
   gcloud sql instances create driftway-postgres \
     --database-version=POSTGRES_14 \
     --tier=db-standard-2 \
     --region=us-central1
   ```

3. **Deploy application**:
   ```bash
   kubectl apply -f k8s-gcp/
   ```

### Azure AKS Deployment

1. **Create AKS cluster**:
   ```bash
   az aks create \
     --resource-group driftway-rg \
     --name driftway-cluster \
     --node-count 3 \
     --node-vm-size Standard_D2s_v3 \
     --enable-addons monitoring \
     --generate-ssh-keys
   ```

2. **Configure Azure Database**:
   ```bash
   az cosmosdb create \
     --name driftway-cosmosdb \
     --resource-group driftway-rg \
     --kind MongoDB
   ```

## Monitoring and Logging Setup

### Prometheus Monitoring

1. **Install Prometheus Operator**:
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
   ```

2. **Configure ServiceMonitor**:
   ```yaml
   # monitoring/servicemonitor.yaml
   apiVersion: monitoring.coreos.com/v1
   kind: ServiceMonitor
   metadata:
     name: driftway-metrics
     namespace: driftway
   spec:
     selector:
       matchLabels:
         app: api-gateway
     endpoints:
     - port: metrics
   ```

### ELK Stack for Logging

1. **Install Elasticsearch**:
   ```bash
   helm repo add elastic https://helm.elastic.co
   helm install elasticsearch elastic/elasticsearch -n logging --create-namespace
   ```

2. **Install Logstash and Kibana**:
   ```bash
   helm install logstash elastic/logstash -n logging
   helm install kibana elastic/kibana -n logging
   ```

3. **Configure Filebeat**:
   ```yaml
   # logging/filebeat.yaml
   apiVersion: beat.k8s.elastic.co/v1beta1
   kind: Beat
   metadata:
     name: filebeat
     namespace: logging
   spec:
     type: filebeat
     config:
       filebeat.inputs:
       - type: container
         paths:
         - /var/log/containers/*.log
       output.logstash:
         hosts: ["logstash:5044"]
   ```

## Security Hardening

### Network Policies

```yaml
# security/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: driftway-network-policy
  namespace: driftway
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: nginx-ingress
    ports:
    - protocol: TCP
      port: 8080
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

### Pod Security Standards

```yaml
# security/pod-security.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: driftway
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### RBAC Configuration

```yaml
# security/rbac.yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: driftway-role
  namespace: driftway
rules:
- apiGroups: [""]
  resources: ["configmaps", "secrets"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: driftway-rolebinding
  namespace: driftway
subjects:
- kind: ServiceAccount
  name: driftway-sa
  namespace: driftway
roleRef:
  kind: Role
  name: driftway-role
  apiGroup: rbac.authorization.k8s.io
```

## Backup and Disaster Recovery

### Database Backups

1. **MongoDB backup script**:
   ```bash
   #!/bin/bash
   # backup-mongodb.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   mongodump --host mongodb-service:27017 --db driftway --out /backups/mongodb_$DATE
   aws s3 cp /backups/mongodb_$DATE s3://driftway-backups/mongodb/
   ```

2. **Redis backup**:
   ```bash
   # Redis automatically creates RDB dumps
   kubectl exec -it redis-pod -- redis-cli BGSAVE
   kubectl cp redis-pod:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
   ```

### Application Backups

```yaml
# backup/cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: database-backup
  namespace: driftway
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: driftway/backup-tool:latest
            command:
            - /backup-script.sh
          restartPolicy: OnFailure
```

## Performance Tuning

### Resource Optimization

1. **Set appropriate resource limits**:
   ```yaml
   resources:
     requests:
       memory: "256Mi"
       cpu: "250m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

2. **Configure HPA (Horizontal Pod Autoscaler)**:
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: api-gateway-hpa
     namespace: driftway
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: api-gateway
     minReplicas: 3
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

### Database Optimization

1. **MongoDB indexes**:
   ```javascript
   // Create indexes for better performance
   db.messages.createIndex({ "channel_id": 1, "created_at": -1 })
   db.users.createIndex({ "email": 1 }, { unique: true })
   db.channels.createIndex({ "members": 1 })
   ```

2. **Redis optimization**:
   ```
   # redis.conf optimizations
   maxmemory 2gb
   maxmemory-policy allkeys-lru
   tcp-keepalive 60
   timeout 0
   ```

## Troubleshooting Deployment Issues

### Common Issues

1. **Pod not starting**:
   ```bash
   kubectl describe pod <pod-name> -n driftway
   kubectl logs <pod-name> -n driftway --previous
   ```

2. **Service not accessible**:
   ```bash
   kubectl port-forward service/api-gateway-service 8080:8080 -n driftway
   curl http://localhost:8080/health
   ```

3. **Database connection issues**:
   ```bash
   kubectl exec -it mongodb-pod -n driftway -- mongo
   kubectl exec -it redis-pod -n driftway -- redis-cli ping
   ```

### Debug Commands

```bash
# Check all resources
kubectl get all -n driftway

# Check events
kubectl get events -n driftway --sort-by='.lastTimestamp'

# Debug networking
kubectl run debug --image=nicolaka/netshoot -it --rm
```

This deployment guide provides comprehensive instructions for deploying Driftway microservices in various environments with proper security, monitoring, and scalability considerations.