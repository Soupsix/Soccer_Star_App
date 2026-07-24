const { withProjectBuildGradle } = require('expo/config-plugins');

const withAndroidCMakeStagingDir = (config) => {
  // Skip on EAS build servers (Linux) or non-Windows platforms
  // This staging dir fix is only needed for local Windows builds
  if (process.env.EAS_BUILD === '1' || process.platform !== 'win32') {
    return config;
  }

  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const buildGradle = config.modResults.contents;
      const snippet = `
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            project.android {
                if (namespace != null) {
                    externalNativeBuild {
                        cmake {
                            buildStagingDirectory new File("C:/tmp/cmake-soccer-star-app/\${project.name}")
                        }
                    }
                }
            }
        }
    }
}
`;
      // Ensure we don't append it multiple times
      if (!buildGradle.includes('buildStagingDirectory new File')) {
        config.modResults.contents = buildGradle.replace('apply plugin: "expo-root-project"', snippet + '\\napply plugin: "expo-root-project"');
      }
    }
    return config;
  });
};

module.exports = withAndroidCMakeStagingDir;
