# Single source of truth for the 11 feature names used by the ML model.
# Both train.py and model.py import from here so they always stay in sync.

FEATURE_NAMES = [
    "nb_critical",       # SAST: number of critical severity issues
    "nb_high",           # SAST: number of high severity issues
    "nb_medium",         # SAST: number of medium severity issues
    "nb_critical_cves",  # SCA:  number of critical CVEs in dependencies
    "nb_high_cves",      # SCA:  number of high CVEs in dependencies
    "max_cvss",          # SCA:  highest CVSS score found (0.0 - 10.0)
    "outdated_count",    # SCA:  number of outdated packages
    "nb_high_alerts",    # DAST: number of high-risk ZAP alerts
    "nb_medium_alerts",  # DAST: number of medium-risk ZAP alerts
    "nb_xss",            # DAST: number of XSS alerts found
    "nb_sqli",           # DAST: number of SQL injection alerts found
]
