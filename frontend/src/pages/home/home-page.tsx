import { useAuth } from "@/shared/hooks/auth-queries";
import { Grid, GridContainer } from "@trussworks/react-uswds";

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="usa-section">
      <GridContainer>
        <Grid row gap>
          <main className="usa-layout-docs__main desktop:grid-col-9 usa-prose usa-layout-docs" id="main-content">
            <h1>Home Page</h1>

            <p>Welcome back, {user?.email}</p>
          </main>
        </Grid>
      </GridContainer>
    </div>
  )   
}