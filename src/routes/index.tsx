

import { component$, useServerMount$, useStore } from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";


export const BUILDER_PUBLIC_API_KEY = "f5a098163c3741e19503f02a69360619";
export const BUILDER_MODEL = "page";



export default component$(() => {
  const location = useLocation();
  const store = useStore({ data: {id:'',name:'', html:''} });

  useServerMount$(async () => {
    const response = await fetch('https://cdn.builder.io/api/v1/qwik/page?url='+ location.pathname +'&apiKey=f5a098163c3741e19503f02a69360619&limit=1');
    store.data = await response.json();
  });

  return (
    <>
    <div dangerouslySetInnerHTML={store.data.html} />
    </>
  );
});