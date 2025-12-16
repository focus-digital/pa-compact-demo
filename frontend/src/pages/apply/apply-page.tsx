import { useAuth } from "@/shared/hooks/auth-queries";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export function ApplyPage() {
  const { user } = useAuth();

  return (
    <div className="usa-section">
      <GridContainer>
        <Grid row gap>
          <main className="usa-layout-docs__main desktop:grid-col-9 usa-prose usa-layout-docs" id="main-content">
            <h1>Application</h1>

            <p>Let's get started, {user?.email}!</p>
          </main>
        </Grid>
      </GridContainer>
    </div>
  )   
}