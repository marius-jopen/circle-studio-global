import type { ViewMode } from '$lib/stores/viewMode';

/**
 * Value of the "Visibility" select on a project.
 * Documents saved before the field existed return null — treated as "Both".
 */
export type ProjectVisibility = 'Both' | 'Grid only' | 'List only';

type VisibilityAware = { id?: string; data?: { visibility?: string | null } };

export function isVisibleInView(visibility: string | null | undefined, view: ViewMode): boolean {
	if (visibility === 'Grid only') return view === 'grid';
	if (visibility === 'List only') return view === 'list';
	return true;
}

/** Keep only the projects that should appear in the given view. */
export function filterProjectsByView<T extends VisibilityAware>(
	projects: T[],
	view: ViewMode
): T[] {
	return (projects ?? []).filter((project) => isVisibleInView(project?.data?.visibility, view));
}

/**
 * IDs of projects explicitly hidden in the given view. Used to filter featured
 * projects, which are content relationships without their own visibility data —
 * an ID that is missing from `projects` stays visible.
 */
export function hiddenProjectIdsForView<T extends VisibilityAware>(
	projects: T[],
	view: ViewMode
): Set<string> {
	const hidden = new Set<string>();
	for (const project of projects ?? []) {
		if (project?.id && !isVisibleInView(project?.data?.visibility, view)) hidden.add(project.id);
	}
	return hidden;
}
