import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import TwoslashFloatingVue from '@shikijs/vitepress-twoslash/client'
import '@shikijs/vitepress-twoslash/style.css'
import './style.css'
import 'virtual:group-icons.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
    })
  },
  enhanceApp({ app }) {
    app.use(TwoslashFloatingVue)
  },
}
