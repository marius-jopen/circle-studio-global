<script lang="ts">
    import type { ProjectsDocument } from '../../prismicio-types';
    import ProjectItem from './projectItem.svelte';
    import ProjectItemMobile from './projectItemMobile.svelte';
    import { onMount } from 'svelte';

    export let projects: ProjectsDocument[] = [];

    let isMobile = false;

    onMount(() => {
        const updateMobile = () => { isMobile = typeof window !== 'undefined' && window.innerWidth < 768; };
        updateMobile();
        window.addEventListener('resize', updateMobile);
        return () => window.removeEventListener('resize', updateMobile);
    });
</script>

{#if projects && projects.length > 0}
<div class="mt-24 pb-3">
    <div class="mb-4 paragraph-1 text-center">More work</div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        {#each projects as project (project.uid)}
            {#key project.uid}
                {#if isMobile}
                    <ProjectItemMobile dimension="portrait" itemsPerRow={3} {project} />
                {:else}
                    <ProjectItem dimension="portrait" itemsPerRow={3} {project} />
                {/if}
            {/key}
        {/each}
    </div>
</div>
{/if}


