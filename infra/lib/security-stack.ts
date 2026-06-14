import {
  Stack,
  StackProps,
  RemovalPolicy,
  aws_s3 as s3,
  aws_cloudtrail as cloudtrail,
  aws_guardduty as guardduty,
  aws_config as config_,
  aws_iam as iam,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { AgaveConfig } from "./config";

interface SecurityStackProps extends StackProps {
  config: AgaveConfig;
}

// Account security baseline (DECIDED): GuardDuty + AWS Config + CloudTrail.
// These are account singletons — if they already exist, set
// `enableSecurityBaseline=false` to skip this stack (see RESUME.md).
export class SecurityStack extends Stack {
  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // CloudTrail (management events) with Insights enabled.
    new cloudtrail.Trail(this, "Trail", {
      isMultiRegionTrail: true,
      insightTypes: [
        cloudtrail.InsightType.API_CALL_RATE,
        cloudtrail.InsightType.API_ERROR_RATE,
      ],
    });

    // GuardDuty detector.
    new guardduty.CfnDetector(this, "GuardDuty", {
      enable: true,
      findingPublishingFrequency: "SIX_HOURS",
    });

    // AWS Config recorder + delivery channel.
    const bucket = new s3.Bucket(this, "ConfigBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal("config.amazonaws.com")],
        actions: ["s3:PutObject", "s3:GetBucketAcl"],
        resources: [bucket.bucketArn, bucket.arnForObjects("*")],
      })
    );

    const role = new iam.Role(this, "ConfigRole", {
      assumedBy: new iam.ServicePrincipal("config.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWS_ConfigRole"),
      ],
    });

    const recorder = new config_.CfnConfigurationRecorder(this, "Recorder", {
      roleArn: role.roleArn,
      recordingGroup: { allSupported: true, includeGlobalResourceTypes: true },
    });
    const channel = new config_.CfnDeliveryChannel(this, "Channel", {
      s3BucketName: bucket.bucketName,
    });
    channel.addDependency(recorder);
  }
}
