const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const fs = require("fs");
const path = require('path');

const customPodfileContent = `
require File.join(File.dirname(\`node --print "require.resolve('expo/package.json')"\`), "scripts/autolinking")
require File.join(File.dirname(\`node --print "require.resolve('react-native/package.json')"\`), "scripts/react_native_pods")

require 'json'
podfile_properties = JSON.parse(File.read(File.join(__dir__, 'Podfile.properties.json'))) rescue {}

ENV['RCT_NEW_ARCH_ENABLED'] = podfile_properties['newArchEnabled'] == 'true' ? '1' : '0'
ENV['EX_DEV_CLIENT_NETWORK_INSPECTOR'] = podfile_properties['EX_DEV_CLIENT_NETWORK_INSPECTOR']

platform :ios, podfile_properties['ios.deploymentTarget'] || '13.0'
install! 'cocoapods',
  :deterministic_uuids => false

prepare_react_native_project!

flipper_config = FlipperConfiguration.disabled
if ENV['NO_FLIPPER'] == '1' then
  # Explicitly disabled through environment variables
  flipper_config = FlipperConfiguration.disabled
elsif podfile_properties.key?('ios.flipper') then
  # Configure Flipper in Podfile.properties.json
  if podfile_properties['ios.flipper'] == 'true' then
    flipper_config = FlipperConfiguration.enabled(["Debug", "Release"])
  elsif podfile_properties['ios.flipper'] != 'false' then
    flipper_config = FlipperConfiguration.enabled(["Debug", "Release"], { 'Flipper' => podfile_properties['ios.flipper'] })
  end
end

target 'NestWallet' do
  use_expo_modules!
  config = use_native_modules!

  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  # Flags change depending on the env values.
  flags = get_default_flags()

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    :fabric_enabled => flags[:fabric_enabled],
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/..",
    # Note that if you have use_frameworks! enabled, Flipper will not work if enabled
    :flipper_configuration => flipper_config
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false
    )
    __apply_Xcode_12_5_M1_post_install_workaround(installer)

    bitcode_strip_path = \`xcrun --find bitcode_strip\`.chop!
    def strip_bitcode_from_framework(bitcode_strip_path, framework_relative_path)
      framework_path = File.join(Dir.pwd, framework_relative_path)
      command = "#{bitcode_strip_path} #{framework_path} -r -o #{framework_path}"
      puts "Stripping bitcode: #{command}"
      system(command)
    end
    
    framework_paths = [
      "Pods/OpenSSL-Universal/Frameworks/OpenSSL.xcframework/ios-arm64/OpenSSL.framework/OpenSSL",
      "Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.framework/hermes",
      "Pods/hermes-engine/destroot/Library/Frameworks/macosx/hermes.framework/Versions/Current/hermes",
      "Pods/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64/hermes.framework/hermes",
      "Pods/hermes-engine/destroot/Library/Frameworks/universal/hermes.xcframework/ios-arm64_x86_64-maccatalyst/hermes.framework/hermes"
    ]
    
    framework_paths.each do |framework_relative_path|
      strip_bitcode_from_framework(bitcode_strip_path, framework_relative_path)
    end

    # This is necessary for Xcode 14, because it signs resource bundles by default
    # when building for devices.
    installer.target_installation_results.pod_target_installation_results
      .each do |pod_name, target_installation_result|
      target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
        resource_bundle_target.build_configurations.each do |config|
          config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        end
      end
    end
  end

  post_integrate do |installer|
    begin
      expo_patch_react_imports!(installer)
    rescue => e
      Pod::UI.warn e
    end
  end
end`;

async function saveFileAsync(path, content) {
  return fs.promises.writeFile(path, content, "utf8");
}

const withModifyPodfile = (c) => {
  return withDangerousMod(c, [
    "ios",
    async (config) => {
      const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      await saveFileAsync(file, customPodfileContent);
      return config;
    },
  ]);
}

const withStripBitcode = (config) => {
  return withPlugins(config, [withModifyPodfile]);
};

module.exports = withStripBitcode;
