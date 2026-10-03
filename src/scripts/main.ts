/** Global client entry — loaded on every page by BaseLayout. */
import { initSheets } from "./sheets";
import { initQuickAdd } from "./quick-add";
import { initEnquiry } from "./enquiry";
import { initSearch } from "./search";
import { initMotion } from "./motion";
import { runSplash } from "./splash";

initSheets();
initQuickAdd();
initEnquiry();
initSearch();
initMotion();
runSplash();
