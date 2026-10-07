import { BrowserRouter } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { Shell } from '@/components/layout/Shell'
import { AppRouter } from '@/app/router'

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Shell>
          <AppRouter />
        </Shell>
      </BrowserRouter>
    </Providers>
  )
}

export default App
