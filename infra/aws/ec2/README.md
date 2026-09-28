# RiTech AWS EC2 deployment

The production compose stack runs Next.js, NestJS, and PostgreSQL on one EC2 instance. Nginx exposes only port 80; PostgreSQL and the API are private to the compose network. The PostgreSQL database and uploaded files persist on the encrypted EBS root volume.

## Continuous deployment

The site is available at <https://d3preziqjebh2s.cloudfront.net>. CloudFront provides the HTTPS viewer URL; the EC2 origin uses a static IP and only accepts CloudFront origin traffic.

The GitHub Actions workflow `.github/workflows/deploy.yml` deploys every push to `main`. It assumes the IAM role `ritech-github-deploy` through GitHub OIDC, finds the instance by its `Name=ritech-web` tag, and asks Systems Manager to run `/usr/local/bin/ritech-deploy update`. No AWS access keys or GitHub secrets are required. The IAM trust is pinned to this GitHub repository’s immutable IDs and the `main` branch; update it if the repository is transferred or recreated.

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

CloudFront serves HTTPS at the free `cloudfront.net` hostname. The EC2 origin security group allows port 80 only from AWS’s CloudFront origin-facing managed prefix list.
