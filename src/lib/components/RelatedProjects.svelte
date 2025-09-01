<script lang="ts">
    import type { ProjectsDocument } from '../../prismicio-types';
    import ProjectItem from './projectItem.svelte';

    export let projects: ProjectsDocument[] = [];
</script>

{#if projects && projects.length > 0}
<div class="mt-24">
    <div class="mb-4 paragraph-1 text-center">More work</div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        {#each projects as project}
            <ProjectItem dimension="portrait" itemsPerRow={3} {project} />
        {/each}
    </div>
</div>
{/if}


