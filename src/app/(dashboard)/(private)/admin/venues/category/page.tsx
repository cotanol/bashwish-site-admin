// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import ThemeListTable from '@views/apps/ecommerce/products/category/ThemeListTable'

// Server Actions
import { getThemes } from '@/actions/theme-actions'

const ThemeCategoryPage = async () => {
  // Fetch themes
  const themes = await getThemes()

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <ThemeListTable themeData={themes} />
      </Grid>
    </Grid>
  )
}

export default ThemeCategoryPage
