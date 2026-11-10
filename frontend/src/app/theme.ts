import type { ThemeConfig } from 'antd'

/**
 * Ant Design theme — shadcn-style
 *
 * Nguyên tắc:
 * - Flat, border-driven — không gradient, không glassmorphism
 * - border-radius: 6 (thống nhất với --radius trong CSS)
 * - Shadow chỉ dùng cho popover / dropdown / modal
 * - Palette giữ nguyên identity 
 */
export const libraryTheme: ThemeConfig = {
  token: {
    // — Palette —
    colorPrimary: '#1F3A2E',
    colorInfo: '#1F3A2E',
    colorSuccess: '#1F3A2E',
    colorWarning: '#B08D3C',
    colorError: '#7A2E2B',
    colorTextBase: '#2A2118',
    colorTextDescription: '#6B5B4B',
    colorBgBase: '#F3ECDC',
    colorBgContainer: '#FBF7EC',
    colorBorder: '#DECFAA',
    colorBorderSecondary: '#EADFC5',

    // — Radius —
    borderRadius: 6,

    // — Typography —
    fontFamily:
      "'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,

    // — Misc —
    wireframe: false,
  },

  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 36,
      fontWeight: 500,
      primaryColor: '#FBF7EC',
      defaultBg: '#FBF7EC',
      defaultColor: '#2A2118',
      defaultBorderColor: '#DECFAA',
    },

    Card: {
      colorBgContainer: '#FBF7EC',
      colorBorderSecondary: '#DECFAA',
      borderRadiusLG: 6,
      boxShadow: 'none',
      boxShadowSecondary: 'none',
      boxShadowTertiary: 'none',
    },

    Table: {
      colorBgContainer: '#FBF7EC',
      headerBg: '#ECE3CF',
      headerColor: '#2A2118',
      rowHoverBg: '#ECE3CF',
      borderColor: '#DECFAA',
      borderRadius: 6,
    },

    Input: {
      colorBgContainer: '#FBF7EC',
      colorBorder: '#DECFAA',
      activeBorderColor: '#1F3A2E',
      hoverBorderColor: '#B08D3C',
      borderRadius: 6,
    },

    Select: {
      colorBgContainer: '#FBF7EC',
      colorBorder: '#DECFAA',
      borderRadius: 6,
    },

    Menu: {
      itemBorderRadius: 6,
      darkItemBg: '#1F3A2E',
      darkItemSelectedBg: '#2A4A3B',
      darkSubMenuItemBg: '#183025',
    },

    Tag: {
      borderRadiusSM: 4,
    },

    Modal: {
      contentBg: '#FBF7EC',
      headerBg: '#FBF7EC',
      borderRadiusLG: 6,
    },

    Breadcrumb: {
      fontSize: 13,
    },

    Tabs: {
      borderRadius: 6,
    },

    DatePicker: {
      borderRadius: 6,
    },

    Popover: {
      borderRadiusLG: 6,
    },

    Dropdown: {
      borderRadiusLG: 6,
    },

    Tooltip: {
      borderRadius: 6,
    },

    Badge: {
      borderRadiusSM: 4,
    },

    Pagination: {
      borderRadius: 6,
    },
  },
}
