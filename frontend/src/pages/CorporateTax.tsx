import { Landmark } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { PageHead } from '../components/ui'
import { useI18n } from '../i18n'
import CorporateProfitStatement from './CorporateProfitStatement'

export default function CorporateTax() {
  const { currentCompany } = useApp()
  const { t } = useI18n()

  return (
    <div>
      <PageHead
        title={t('pgTax.corporate.title')}
        desc={t('pgTax.corporate.desc')}
      />
      <CorporateProfitStatement />
    </div>
  )
}
