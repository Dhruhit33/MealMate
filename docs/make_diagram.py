#!/usr/bin/env python3
"""
MealMate Cloud Architecture Diagram Generator
Reads docs/plan.json produced by terraform show -json, detects planned resources,
and renders presentation-grade diagrams using mingrammer/diagrams.
"""

import json
import os
import sys

# Ensure UTF-8 console output on Windows
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure Graphviz dot is on PATH if in custom local folder
dot_dir = r"D:\dhruhit\e drive\all ennovative\inovatice cna and devoops\bin\graphviz\Graphviz-12.2.1-win64\bin"
if os.path.isdir(dot_dir) and dot_dir not in os.environ.get("PATH", ""):
    os.environ["PATH"] = dot_dir + os.pathsep + os.environ.get("PATH", "")

from diagrams import Diagram, Cluster, Edge, Node
from diagrams.aws.network import CloudFront
from diagrams.aws.storage import S3
from diagrams.aws.compute import EC2, Lambda
from diagrams.aws.database import RDS
from diagrams.aws.management import ParameterStore, Cloudwatch
from diagrams.onprem.client import Users
from diagrams.onprem.vcs import Github

FORBIDDEN_FREE_TIER = {
    "aws_lb": "ALB (Application Load Balancer)",
    "aws_alb": "ALB",
    "aws_ecs_service": "Fargate / ECS",
    "aws_ecr_repository": "ECR",
    "aws_msk_cluster": "MSK (Managed Kafka)",
    "aws_elasticache_cluster": "ElastiCache (Managed Redis)",
    "aws_nat_gateway": "NAT Gateway",
    "aws_wafv2_web_acl": "AWS WAF",
    "aws_route53_zone": "Route 53",
    "aws_secretsmanager_secret": "Secrets Manager",
}

def load_plan(plan_path="docs/plan.json"):
    if not os.path.exists(plan_path):
        print(f"❌ Error: Plan file not found at {plan_path}")
        sys.exit(1)

    with open(plan_path, "r", encoding="utf-8-sig") as f:
        data = json.load(f)

    resource_types = set()
    multi_az_found = False

    for rc in data.get("resource_changes", []):
        rtype = rc.get("type")
        resource_types.add(rtype)
        
        # Check Multi-AZ RDS
        if rtype == "aws_db_instance":
            after = rc.get("change", {}).get("after", {})
            if after and after.get("multi_az") is True:
                multi_az_found = True

    print("\n🔍 Found Resource Types in Terraform Plan:")
    for rt in sorted(resource_types):
        print(f"  • {rt}")

    # Check Free-Tier compliance
    warnings = []
    for f_type, label in FORBIDDEN_FREE_TIER.items():
        if f_type in resource_types:
            warnings.append(f"⚠️ Free-Tier Warning: Detected non-free-tier resource '{label}' in plan.")
    if multi_az_found:
        warnings.append("⚠️ Free-Tier Warning: Detected Multi-AZ RDS MySQL in plan.")

    if warnings:
        print("\n" + "\n".join(warnings))
    else:
        print("\n✅ Strict AWS Free-Tier verification passed: 0 non-free-tier services detected.")

    return resource_types

def render_diagram(resource_types, out_format="png"):
    has_cf = "aws_cloudfront_distribution" in resource_types
    has_s3 = "aws_s3_bucket" in resource_types
    has_asg = "aws_autoscaling_group" in resource_types or "aws_launch_template" in resource_types
    has_rds = "aws_db_instance" in resource_types
    has_ssm = "aws_ssm_parameter" in resource_types
    has_cw = "aws_cloudwatch_log_group" in resource_types
    has_lambda = "aws_lambda_function" in resource_types

    # Warn if expected components are missing
    if not has_cf:
        print("⚠️ Warning: aws_cloudfront_distribution not found in plan!")
    if not has_s3:
        print("⚠️ Warning: aws_s3_bucket not found in plan!")
    if not has_asg:
        print("⚠️ Warning: aws_autoscaling_group / aws_launch_template not found in plan!")
    if not has_rds:
        print("⚠️ Warning: aws_db_instance not found in plan!")

    diag_attr = {
        "fontsize": "14",
        "fontname": "Arial",
        "pad": "0.5",
        "splines": "spline",
    }
    graph_attr = {
        "fontsize": "13",
        "fontname": "Arial",
    }
    node_attr = {
        "fontname": "Arial",
        "fontsize": "10",
    }

    # Style colors matching the architecture prompt
    PURPLE = "#4D3B9B"
    TEAL = "#0E7C66"

    with Diagram(
        name="MealMate Cloud Architecture (AWS Free Tier)",
        filename="docs/architecture",
        outformat=out_format,
        show=False,
        graph_attr=diag_attr,
        node_attr=node_attr,
    ):
        users = Users("Users\n(Web / Mobile)")

        # External GHCR
        ghcr = Github("GitHub + GHCR\nFree image registry")

        # CloudFront & S3
        cf = CloudFront("CloudFront\nFree HTTPS and CDN") if has_cf else None
        s3 = S3("S3 bucket\nReact build") if has_s3 else None

        with Cluster("AWS region, default VPC", graph_attr=graph_attr):
            with Cluster("EC2 running k3s (Kubernetes)", graph_attr={"bgcolor": "#F8FAFC", "style": "rounded"}):
                traefik = Node(
                    "Traefik Ingress\nBuilt into k3s, port 80",
                    shape="box",
                    style="filled,rounded",
                    fillcolor="#1E293B",
                    fontcolor="white",
                    height="0.7",
                    width="2.2"
                )
                config_eureka = Node(
                    "Config + Eureka\nDeployment, 1 pod",
                    shape="box",
                    style="filled,rounded",
                    fillcolor=PURPLE,
                    fontcolor="white",
                    height="0.7",
                    width="1.8"
                )
                api_gw = Node(
                    "API gateway\n2 pods + autoscaler",
                    shape="box",
                    style="filled,rounded",
                    fillcolor=PURPLE,
                    fontcolor="white",
                    height="0.7",
                    width="1.8"
                )
                business_svc = Node(
                    "Business services\n6 Deployments, 1-2 pods",
                    shape="box",
                    style="filled,rounded",
                    fillcolor=PURPLE,
                    fontcolor="white",
                    height="0.7",
                    width="2.0"
                )
                redis_kafka = Node(
                    "Kafka + Redis\nStatefulSets, 1 pod each",
                    shape="box",
                    style="filled,rounded",
                    fillcolor=TEAL,
                    fontcolor="white",
                    height="0.7",
                    width="2.0"
                )

            # RDS MySQL
            rds = RDS("RDS MySQL\ndb.t4g.micro, 1 AZ") if has_rds else None

        # Supporting nodes
        with Cluster("Supporting Services (Free Tier)", graph_attr={"style": "dashed"}):
            ssm = ParameterStore("SSM Parameters\nFree secrets") if has_ssm else None
            cw = Cloudwatch("CloudWatch\nLogs, 7d keep") if has_cw else None
            tf_kubectl = Node(
                "Terraform + kubectl\nBuilds and deploys",
                shape="box",
                style="filled,rounded",
                fillcolor="#0F172A",
                fontcolor="white",
                height="0.7",
                width="2.0"
            )

        # Edges
        if cf:
            users >> Edge(label="HTTPS", color="#1F2937") >> cf
            if s3:
                cf >> Edge(label="Static UI", color="#2563EB") >> s3
            cf >> Edge(label="/api/*", color="#7C3AED") >> traefik

        traefik >> Edge(color="#7C3AED") >> api_gw
        api_gw >> Edge(color="#7C3AED") >> business_svc
        business_svc >> Edge(color="#059669") >> redis_kafka
        if rds:
            business_svc >> Edge(color="#059669", label="JDBC") >> rds

        ghcr >> Edge(label="k3s pull", style="dashed", color="#4B5563") >> traefik

def main():
    print("=" * 60)
    print("  MealMate Architecture Diagram Generator (from plan.json)")
    print("=" * 60)
    resources = load_plan("docs/plan.json")
    
    print("\n🎨 Generating docs/architecture.png...")
    render_diagram(resources, out_format="png")
    print("  ✅ docs/architecture.png generated!")

    print("\n🎨 Generating docs/architecture.svg...")
    render_diagram(resources, out_format="svg")
    print("  ✅ docs/architecture.svg generated!")

if __name__ == "__main__":
    main()
