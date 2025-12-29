import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

export default function TabLayout() {
  // Dynamic colors for native tabs
  const tintColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: '#FFFFFF', light: '#000000' })
    : '#6366F1';

  const labelColor = Platform.OS === 'ios'
    ? DynamicColorIOS({ dark: 'rgba(255,255,255,0.8)', light: 'rgba(0,0,0,0.8)' })
    : '#6366F1';

  return (
    <NativeTabs
      tintColor={tintColor}
      labelStyle={{
        color: labelColor,
      }}
    >
      <NativeTabs.Trigger
        name="index"
        options={{
          title: 'Home',
        }}
      >
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          selectedColor={tintColor}
        />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="progress"
        options={{
          title: 'Progress',
        }}
      >
        <Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          selectedColor={tintColor}
        />
        <Label>Progress</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="profile"
        options={{
          title: 'Profile',
        }}
      >
        <Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          selectedColor={tintColor}
        />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
