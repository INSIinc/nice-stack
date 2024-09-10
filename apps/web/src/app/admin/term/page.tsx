import TaxonomyTable from "@web/src/components/models/taxonomy/taxonomy-table";
import TermList from "@web/src/components/models/term/term-list";

export default function TermAdminPage() {
    return <div className="p-2 rounded-xl bg-white shadow flex flex-grow">
        <div className=" border-r p-2">
            <TaxonomyTable></TaxonomyTable>
        </div>
        <div className="p-2 flex-1">   <TermList></TermList></div>
    </div>
}