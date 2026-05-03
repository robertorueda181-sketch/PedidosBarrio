import { TemplateThreePageData } from "../../../../pages/company/templates/template3/template3-content";
import { NegocioDetalle } from "../../../../shared/services/negocio.service";

export interface SiteBuilderDraft {
    pageData: TemplateThreePageData;
    business: NegocioDetalle;
    savedAt: string | null;
}