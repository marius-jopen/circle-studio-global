<script lang="ts">
  interface PersonData {
    title?: string;
    link?: { url?: string } | string | null;
  }

  interface CreditItem {
    label?: string;
    person?: Array<{ data?: PersonData } | any>;
  }

  interface Props {
    credits: CreditItem[] | any;
  }
  const { credits }: Props = $props();
</script>

{#if credits && credits.length > 0}
  {@const validCredits = (credits as CreditItem[]).filter((credit: CreditItem) => credit.label && credit.person && credit.person.length > 0)}
  {#if validCredits.length > 0}
    <section class="mb-3 mt-0.5 text-sm bg-neutral-100 rounded px-4 py-5">
      <div class=" font-normal text-center w-full mb-4">Credits</div>
      <div class="text-primary">
        {#each validCredits as credit}
          {@const persons = (credit.person ?? []) as Array<{ data?: PersonData } | any>}
          <div class="flex flex-col pb-2 text-center">
            <span class="w-full text-neutral-400">{credit.label}</span>
            <span class="w-full">
              {#each persons as person, index}
                {@const personData = person.data}
                {@const linkUrl = personData?.link?.url || personData?.link}
                <span class="person-entry">
                  {#if linkUrl}
                    <a href={linkUrl} target="_blank">
                      {personData?.title || `Person ${index + 1}`}
                    </a>
                  {:else}
                    <span>{personData?.title || `Person ${index + 1}`}</span>
                  {/if}
                </span>
              {/each}
            </span>
          </div>
        {/each}
      </div>
    </section>
  {/if}
{/if}

<style>
  .person-entry:not(:last-child)::after {
    content: ', ';
  }
  .person-entry { white-space: normal; }
</style>

