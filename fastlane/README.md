fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios create_app

```sh
[bundle exec] fastlane ios create_app
```

Create Declutter app in App Store Connect

### ios setup_capabilities

```sh
[bundle exec] fastlane ios setup_capabilities
```

Enable Push Notifications and Sign in with Apple

### ios metadata

```sh
[bundle exec] fastlane ios metadata
```

Upload App Store metadata

### ios release_with_eas

```sh
[bundle exec] fastlane ios release_with_eas
```

Build and upload with EAS Submit (preferred for Expo)

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
