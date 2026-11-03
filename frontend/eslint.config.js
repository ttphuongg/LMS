import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // 1. Chặn import file nội bộ của feature khác (chỉ cho phép import qua @/features/<name>)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features/*/*',
                '../**/features/*/*',
                '../../**/features/*/*',
                '../../../**/features/*/*',
              ],
              message:
                'VI PHẠM VERTICAL SLICE: Không được import file nội bộ của feature khác! Chỉ được phép import qua Public API: "@/features/<tên_feature>".',
            },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // 2. Chặn tuyệt đối shared/ import từ features/
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/features',
                '@/features/**',
                '../features/**',
                '../../features/**',
                '../../../features/**',
              ],
              message:
                'VI PHẠM KIẾN TRÚC: Thư mục shared/ tuyệt đối KHÔNG được import từ features/!',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist', 'node_modules', '*.config.*'],
  }
)
