# RiTech AWS EC2 deployment

The production compose stack runs Next.js, NestJS, and PostgreSQL on one EC2 instance. Nginx exposes only port 80; PostgreSQL and the API are private to the compose network. The PostgreSQL database and uploaded files persist on the encrypted EBS root volume.

## Continuous deployment

The GitHub Actions workflow `.github/workflows/deploy.yml` deploys every push to `main`. It assumes the IAM role `ritech-github-deploy` through GitHub OIDC, finds the instance by its `Name=ritech-web` tag, and asks Systems Manager to run `/usr/local/bin/ritech-deploy update`. No AWS access keys or GitHub secrets are required.

The deployment script fast-forwards the checkout, runs `prisma migrate deploy`, rebuilds the API and web images, then restarts the Compose stack. Do not replace this migration with `prisma db push`.

## Operations

On the instance, use:

```bash
sudo docker compose --env-file /opt/ritech/app/.env.production \
  -f /opt/ritech/app/infra/aws/ec2/compose.yml ps
sudo docker compose --env-file /opt/ritech/app/.env.production \
  -f /opt/ritech/app/infra/aws/ec2/compose.yml logs --tail=100
```

Database files live at `/var/lib/ritech/postgres`; uploads live at `/var/lib/ritech/storage`. Take and test encrypted EBS snapshots before important data changes. The instance and database are single-AZ and are not highly available. Add automated backups, monitoring, managed PostgreSQL, and a multi-AZ frontend/API architecture before treating this as a production service with critical data.

The public HTTP origin can be fronted by a CloudFront distribution using its free `cloudfront.net` hostname and HTTPS viewer connection. The EC2 origin should only accept traffic from the CloudFront origin-facing managed prefix list after the distribution is ready.
