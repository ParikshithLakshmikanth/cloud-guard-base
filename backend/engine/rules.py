"""
CloudGuard Lite — 44 Security Rule Definitions
Each rule: id, name, severity, category, pattern (regex string), fix, description
"""
from dataclasses import dataclass, field
from typing import List
import re


@dataclass
class Rule:
    id: str
    name: str
    severity: str          # critical | high | medium | low
    category: str          # general | docker | k8s | aws
    pattern: str           # raw regex string
    fix: str
    description: str
    safe_placeholder: str = ""   # used by clean-config generator

    def compile(self) -> re.Pattern:
        return re.compile(self.pattern, re.IGNORECASE | re.MULTILINE)


RULES: List[Rule] = [
    # ── CRITICAL ──────────────────────────────────────────────────────────────
    Rule(
        id="R001", name="Public S3 Bucket", severity="critical", category="aws",
        pattern=r'"?public[_-]?access"?\s*[:=]\s*["\']?true["\']?',
        fix="Set 'public_access: false' and use IAM policies to control bucket access.",
        description="S3 bucket is publicly accessible — any internet user can read/write data.",
        safe_placeholder="false",
    ),
    Rule(
        id="R002", name="Hardcoded Password", severity="critical", category="general",
        pattern=r'"?password"?\s*[:=]\s*["\']?[a-zA-Z0-9@#$%^&*_\-.]{4,}["\']?',
        fix="Never hardcode passwords. Use environment variables or AWS Secrets Manager.",
        description="A plaintext password is embedded in the config file.",
        safe_placeholder="<USE_ENV_VAR>",
    ),
    Rule(
        id="R003", name="Hardcoded API Key", severity="critical", category="general",
        pattern=r'"?api[_-]?key"?\s*[:=]\s*["\']?[a-zA-Z0-9\-_]{6,}["\']?',
        fix="Move API keys to environment variables. Never commit secrets to source code.",
        description="API key is hardcoded and may be committed to version control.",
        safe_placeholder="<USE_ENV_VAR>",
    ),
    Rule(
        id="R004", name="Hardcoded Secret Key", severity="critical", category="general",
        pattern=r'"?secret[_-]?key"?\s*[:=]\s*["\']?[a-zA-Z0-9\-_]{6,}["\']?',
        fix="Store secret keys in a vault (e.g. HashiCorp Vault, AWS Secrets Manager).",
        description="Secret key is exposed directly in configuration.",
        safe_placeholder="<USE_ENV_VAR>",
    ),
    Rule(
        id="R005", name="Hardcoded Access Token", severity="critical", category="general",
        pattern=r'"?access[_-]?token"?\s*[:=]\s*["\']?[a-zA-Z0-9\-_.]{8,}["\']?',
        fix="Use short-lived tokens via IAM roles. Never hardcode long-lived tokens.",
        description="Long-lived access token embedded in config — high risk of leakage.",
        safe_placeholder="<USE_ENV_VAR>",
    ),
    Rule(
        id="R006", name="Admin Credentials Exposed", severity="critical", category="general",
        pattern=r'"?admin[_-]?password"?\s*[:=]\s*["\']?.+["\']?',
        fix="Remove admin credentials from config. Use IAM roles with least-privilege access.",
        description="Admin-level password found in plaintext configuration.",
        safe_placeholder="<USE_ENV_VAR>",
    ),
    Rule(
        id="R007", name="Private Key in Config", severity="critical", category="general",
        pattern=r'-----BEGIN (RSA |EC )?PRIVATE KEY-----|"?private[_-]?key"?\s*[:=]',
        fix="Never store private keys in config files. Use certificate stores or KMS.",
        description="Private cryptographic key detected — critical security exposure.",
        safe_placeholder="<REMOVE_PRIVATE_KEY>",
    ),
    # ── HIGH ──────────────────────────────────────────────────────────────────
    Rule(
        id="R008", name="Unencrypted Storage", severity="high", category="general",
        pattern=r'"?encrypt(ion|ed)?"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable encryption at rest. Set 'encryption: true' or configure KMS keys.",
        description="Storage resource has encryption disabled — data at rest is unprotected.",
        safe_placeholder="true",
    ),
    Rule(
        id="R009", name="All Ports Open (0.0.0.0/0)", severity="high", category="general",
        pattern=r'"?cidr"?\s*[:=]\s*["\']?0\.0\.0\.0\/0["\']?',
        fix="Restrict CIDR ranges to known IPs. Never expose all ports to the internet.",
        description="Network rule allows traffic from any IP address on any port.",
        safe_placeholder='"10.0.0.0/24"',
    ),
    Rule(
        id="R010", name="Root Account Usage", severity="high", category="general",
        pattern=r'"?user"?\s*[:=]\s*["\']?root["\']?',
        fix="Avoid root credentials. Create IAM users with least-privilege permissions.",
        description="Root account credentials are being used — violates least-privilege.",
        safe_placeholder='"<IAM_USER>"',
    ),
    Rule(
        id="R011", name="SSL/TLS Disabled", severity="high", category="general",
        pattern=r'"?ssl"?\s*[:=]\s*["\']?false["\']?|"?tls"?\s*[:=]\s*["\']?false["\']?',
        fix="Always enable SSL/TLS for data in transit. Use valid certificates.",
        description="SSL/TLS is disabled — data transmitted in plaintext.",
        safe_placeholder="true",
    ),
    Rule(
        id="R012", name="Firewall Disabled", severity="high", category="general",
        pattern=r'"?firewall"?\s*[:=]\s*["\']?false["\']?|"?enable[_-]?firewall"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable firewall rules to control inbound and outbound traffic.",
        description="Firewall is disabled — resource has no network protection.",
        safe_placeholder="true",
    ),
    Rule(
        id="R013", name="Unrestricted SSH Access", severity="high", category="general",
        pattern=r'port\s*[:=]\s*["\']?22["\']?.*cidr|ssh.*0\.0\.0\.0',
        fix="Restrict SSH (port 22) to specific trusted IP addresses only.",
        description="SSH port 22 is open to 0.0.0.0/0 — anyone can attempt SSH login.",
        safe_placeholder='"10.0.0.0/24"',
    ),
    # ── MEDIUM ────────────────────────────────────────────────────────────────
    Rule(
        id="R014", name="Logging Disabled", severity="medium", category="general",
        pattern=r'"?logging"?\s*[:=]\s*["\']?false["\']?|"?enable[_-]?logging"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable logging to track access patterns and detect suspicious activity.",
        description="Audit logging is disabled — no trail of access or changes.",
        safe_placeholder="true",
    ),
    Rule(
        id="R015", name="MFA Not Enforced", severity="medium", category="general",
        pattern=r'"?mfa([_-]?enabled)?"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable MFA for all user accounts, especially admin and privileged roles.",
        description="Multi-factor authentication is disabled — single factor only.",
        safe_placeholder="true",
    ),
    Rule(
        id="R016", name="Monitoring Disabled", severity="medium", category="general",
        pattern=r'"?monitor(ing)?"?\s*[:=]\s*["\']?false["\']?|"?enable[_-]?monitoring"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable monitoring to track resource health and detect anomalies early.",
        description="Resource monitoring is off — no alerting on suspicious behavior.",
        safe_placeholder="true",
    ),
    Rule(
        id="R017", name="Versioning Disabled", severity="medium", category="general",
        pattern=r'"?versioning"?\s*[:=]\s*["\']?false["\']?|"?enable[_-]?versioning"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable versioning on storage to protect against accidental data deletion.",
        description="Object versioning disabled — no recovery from accidental deletes.",
        safe_placeholder="true",
    ),
    Rule(
        id="R018", name="Weak Password Policy", severity="medium", category="general",
        pattern=r'"?min[_-]?password[_-]?length"?\s*[:=]\s*["\']?[1-7]["\']?',
        fix="Set minimum password length to at least 12 characters.",
        description="Password policy minimum length is below 8 — easily brute-forced.",
        safe_placeholder="14",
    ),
    Rule(
        id="R019", name="Debug Mode Enabled", severity="medium", category="general",
        pattern=r'"?debug"?\s*[:=]\s*["\']?true["\']?',
        fix="Disable debug mode in production. It can expose sensitive stack traces.",
        description="Debug mode is on in what appears to be a production config.",
        safe_placeholder="false",
    ),
    # ── LOW ───────────────────────────────────────────────────────────────────
    Rule(
        id="R020", name="Backup Disabled", severity="low", category="general",
        pattern=r'"?backup"?\s*[:=]\s*["\']?false["\']?|"?enable[_-]?backup"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable automated backups with a defined retention period.",
        description="Automated backups are disabled — risk of permanent data loss.",
        safe_placeholder="true",
    ),
    Rule(
        id="R021", name="No Tags Defined", severity="low", category="general",
        pattern=r'"?tags"?\s*[:=]\s*(\{\s*\}|\[\s*\]|null)',
        fix="Add resource tags for cost tracking, ownership, and environment ID.",
        description="Resource has no tags — impedes cost attribution and governance.",
        safe_placeholder='{"env": "production", "owner": "team"}',
    ),
    Rule(
        id="R022", name="Auto Updates Disabled", severity="low", category="general",
        pattern=r'"?auto[_-]?update"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable automatic updates to ensure security patches are applied promptly.",
        description="Automatic updates are off — security patches may be missed.",
        safe_placeholder="true",
    ),
    Rule(
        id="R023", name="Deletion Protection Off", severity="low", category="general",
        pattern=r'"?deletion[_-]?protection"?\s*[:=]\s*["\']?false["\']?',
        fix="Enable deletion protection on critical resources to prevent accidental removal.",
        description="No deletion protection — resource can be accidentally destroyed.",
        safe_placeholder="true",
    ),
    # ── DOCKERFILE ────────────────────────────────────────────────────────────
    Rule(
        id="R024", name="Container Running as Root", severity="critical", category="docker",
        pattern=r'^USER\s+root\s*$',
        fix="Use a non-root user: add 'RUN adduser -D appuser' and 'USER appuser'.",
        description="Dockerfile sets USER to root — any exploit gains full host access.",
        safe_placeholder="USER appuser",
    ),
    Rule(
        id="R025", name="ADD Instead of COPY", severity="medium", category="docker",
        pattern=r'^ADD\s+(?!http)',
        fix="Replace ADD with COPY for local files. ADD has implicit tar extraction risks.",
        description="ADD command used for local files — COPY is safer and more explicit.",
        safe_placeholder="COPY",
    ),
    Rule(
        id="R026", name="Secret in ENV Instruction", severity="critical", category="docker",
        pattern=r'^ENV\s+.*(SECRET|PASSWORD|API_KEY|TOKEN|PRIVATE_KEY)\s*=\s*\S+',
        fix="Never set secrets via ENV. Use Docker secrets or runtime env injection.",
        description="Secret/password set via ENV — visible in image layers and history.",
        safe_placeholder="ENV SECRET=<USE_RUNTIME_SECRET>",
    ),
    Rule(
        id="R027", name="Package Install Without --no-cache", severity="low", category="docker",
        pattern=r'RUN\s+(apk\s+add|apt-get\s+install)(?!.*--no-cache)',
        fix="Add --no-cache (apk) or 'rm -rf /var/lib/apt/lists/*' to reduce image size.",
        description="Package install without cache cleanup inflates image size.",
        safe_placeholder="RUN apk add --no-cache",
    ),
    Rule(
        id="R028", name="Latest Tag Usage", severity="medium", category="docker",
        pattern=r'^FROM\s+\S+:latest',
        fix="Pin to a specific image version tag for reproducible and auditable builds.",
        description="':latest' tag used — builds are non-reproducible and unpredictable.",
        safe_placeholder="FROM node:20-alpine",
    ),
    Rule(
        id="R029", name="Privileged Mode in Compose", severity="critical", category="docker",
        pattern=r'privileged\s*:\s*true',
        fix="Remove 'privileged: true'. Grant only specific Linux capabilities needed.",
        description="Container runs in privileged mode — full host kernel access.",
        safe_placeholder="privileged: false",
    ),
    Rule(
        id="R030", name="Exposed SSH Port", severity="high", category="docker",
        pattern=r'^EXPOSE\s+22\b',
        fix="Remove EXPOSE 22. Do not run SSH inside containers — use kubectl exec.",
        description="SSH port 22 exposed in container — unnecessary attack surface.",
        safe_placeholder="# EXPOSE 22  # removed",
    ),
    # ── KUBERNETES ────────────────────────────────────────────────────────────
    Rule(
        id="R031", name="K8s Privileged Container", severity="critical", category="k8s",
        pattern=r'privileged\s*:\s*true',
        fix="Remove privileged: true. Use specific securityContext capabilities instead.",
        description="Pod is running in privileged mode — full node access.",
        safe_placeholder="privileged: false",
    ),
    Rule(
        id="R032", name="Host Network Enabled", severity="high", category="k8s",
        pattern=r'hostNetwork\s*:\s*true',
        fix="Set hostNetwork: false. Use ClusterIP services for inter-pod communication.",
        description="Pod shares host network namespace — bypasses network policies.",
        safe_placeholder="hostNetwork: false",
    ),
    Rule(
        id="R033", name="Missing Resource Limits", severity="medium", category="k8s",
        pattern=r'resources\s*:\s*\{\s*\}|resources\s*:\s*$',
        fix="Define resources.limits (cpu, memory) for every container.",
        description="No resource limits — pod can consume all node CPU/memory.",
        safe_placeholder="resources:\n  limits:\n    cpu: '500m'\n    memory: '256Mi'",
    ),
    Rule(
        id="R034", name="Running as Root (runAsUser: 0)", severity="high", category="k8s",
        pattern=r'runAsUser\s*:\s*0',
        fix="Set runAsUser to a non-zero UID. Use runAsNonRoot: true as a safeguard.",
        description="Container is explicitly configured to run as root (UID 0).",
        safe_placeholder="runAsUser: 1000",
    ),
    Rule(
        id="R035", name="Allow Privilege Escalation", severity="high", category="k8s",
        pattern=r'allowPrivilegeEscalation\s*:\s*true',
        fix="Set allowPrivilegeEscalation: false in securityContext.",
        description="Privilege escalation allowed — process can gain more permissions.",
        safe_placeholder="allowPrivilegeEscalation: false",
    ),
    Rule(
        id="R036", name="Host PID Namespace Shared", severity="high", category="k8s",
        pattern=r'hostPID\s*:\s*true',
        fix="Set hostPID: false. Containers should not see host process table.",
        description="Pod shares host PID namespace — can inspect/kill host processes.",
        safe_placeholder="hostPID: false",
    ),
    Rule(
        id="R037", name="Secret in ConfigMap", severity="high", category="k8s",
        pattern=r'kind\s*:\s*ConfigMap[\s\S]*?(password|secret|token|key)\s*:',
        fix="Move sensitive values to Kubernetes Secrets, not ConfigMaps (they're base64 only, use Sealed Secrets or External Secrets Operator).",
        description="Sensitive key found in a ConfigMap — ConfigMaps are not encrypted.",
        safe_placeholder="# Move to Secret",
    ),
    # ── AWS IAM ───────────────────────────────────────────────────────────────
    Rule(
        id="R038", name="IAM Wildcard Action", severity="critical", category="aws",
        pattern=r'"Action"\s*:\s*["\']?\*["\']?',
        fix="Replace '*' with specific IAM actions (e.g. 's3:GetObject'). Apply least privilege.",
        description="IAM policy grants all actions ('*') — over-privileged principal.",
        safe_placeholder='"Action": ["s3:GetObject"]',
    ),
    Rule(
        id="R039", name="IAM Wildcard Resource", severity="critical", category="aws",
        pattern=r'"Resource"\s*:\s*["\']?\*["\']?',
        fix="Scope Resource to specific ARNs instead of '*'.",
        description="IAM policy applies to all resources ('*') — overly broad access.",
        safe_placeholder='"Resource": "arn:aws:s3:::my-bucket/*"',
    ),
    Rule(
        id="R040", name="IAM Inline Policy", severity="medium", category="aws",
        pattern=r'aws_iam_user_policy\b|inline_policy\b',
        fix="Use managed IAM policies instead of inline policies for reusability and auditing.",
        description="Inline policy detected — harder to audit, reuse, and track.",
        safe_placeholder="# Use aws_iam_policy_attachment instead",
    ),
    Rule(
        id="R041", name="IAM NotAction Anti-Pattern", severity="high", category="aws",
        pattern=r'"NotAction"\s*:',
        fix="Replace NotAction with an explicit allow list of required actions.",
        description="NotAction grants everything except a list — nearly always too permissive.",
        safe_placeholder='"Action": ["specific:Action"]',
    ),
    Rule(
        id="R042", name="Cross-Account Trust Without Condition", severity="high", category="aws",
        pattern=r'"sts:AssumeRole"[\s\S]*?"AWS"\s*:\s*"arn:aws:iam::(?!.*Condition)',
        fix="Add a Condition block with MFA requirement or external ID to cross-account trust.",
        description="Cross-account AssumeRole trust has no conditions — confused deputy risk.",
        safe_placeholder='# Add "Condition": {"Bool": {"aws:MultiFactorAuthPresent": "true"}}',
    ),
    Rule(
        id="R043", name="Hardcoded AWS Access Key", severity="critical", category="aws",
        pattern=r'aws_access_key_id\s*[:=]\s*["\']?AKIA[A-Z0-9]{16}["\']?',
        fix="Remove the access key. Use IAM roles, instance profiles, or AWS Vault.",
        description="AWS access key ID is hardcoded — immediate credential leak risk.",
        safe_placeholder="aws_access_key_id: <USE_IAM_ROLE>",
    ),
    Rule(
        id="R044", name="Missing MFA on AssumeRole", severity="medium", category="aws",
        pattern=r'"sts:AssumeRole"(?![\s\S]*?MultiFactorAuthPresent)',
        fix="Add 'aws:MultiFactorAuthPresent': 'true' condition to AssumeRole policies.",
        description="AssumeRole policy doesn't require MFA — any valid credential can assume.",
        safe_placeholder='# Add MFA condition block',
    ),
]

RULE_MAP = {r.id: r for r in RULES}
