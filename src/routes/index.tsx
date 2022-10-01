import { component$} from "@builder.io/qwik";


export const BUILDER_PUBLIC_API_KEY = "f5a098163c3741e19503f02a69360619";
export const BUILDER_MODEL = "page";

export default component$(() => {

  return (
<div>
<script async src="https://cdn.builder.io/js/webcomponents"></script>
<builder-component model={BUILDER_MODEL} api-key={BUILDER_PUBLIC_API_KEY}>
  Loading...
</builder-component>
</div>


  );
});