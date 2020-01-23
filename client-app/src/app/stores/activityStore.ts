import { observable, action, computed, configure, runInAction } from 'mobx';
import { createContext, SyntheticEvent } from 'react';
import { IActivity } from '../models/activity';
import agent from '../api/agent';

configure({ enforceActions: 'always' });

class ActivityStore {
    @observable activityRegistry = new Map();
    @observable activities: IActivity[] = [];
    @observable selectedActivity: IActivity | undefined;
    @observable loadingInitial = false;
    @observable editMode = false;
    @observable submitting = false;
    @observable target = '';

    @computed get activitiesByDate() {
        return Array.from(this.activityRegistry.values()).sort(
            (a, b) => Date.parse(a.date) - Date.parse(b.date)
        );
    }

    @action loadActivities = () => {
        this.loadingInitial = true;
        agent.Activities.list()
            .then(activities => {
                runInAction('load activities then', () => {
                    activities.forEach((activity) => {
                        activity.date = activity.date.split('.')[0]
                        this.activityRegistry.set(activity.id, activity);
                    })
                });
            })
            .catch((error) => runInAction('load activities error',() => console.error(error)))
            .finally(() => runInAction('load activities finally',() => this.loadingInitial = false));
    };

    getActivity = (id: string) => {
        return this.activityRegistry.get(id);
    }

    @action loadActivity = async (id: string) => {
        let activity = this.activityRegistry.get(id);
        if (activity) this.selectedActivity = activity;
        else {
            this.loadingInitial = true;
            agent.Activities.details(id)
                .then(() => {
                    runInAction('load single activity then', () => {
                    this.activityRegistry.set(id, activity);
                    // this.selectedActivity = activity;
                    this.editMode = false;
                    })
                })
                .catch((error) =>  runInAction('load single activity error',() => console.error(error)))
                .finally(() => runInAction('load single activity finally',() => this.loadingInitial = false));
        }
    };

    @action createActivity = (activity: IActivity) => {
        this.submitting = true;
        agent.Activities.create(activity)
            .then(() => {
                runInAction('create activity then', () => {
                    this.activityRegistry.set(activity.id, activity);
                    this.editMode = false;
                })
            })
            .catch((error) => runInAction('create activity error',() => console.error(error)))
            .finally(() => runInAction('create activity finally',() => this.submitting = false));
    };


    @action editActivity = (activity: IActivity) => {
        this.submitting = true;
        agent.Activities.update(activity)
            .then(() => {
                runInAction('edit activity then', () => {
                this.activityRegistry.set(activity.id, activity);
                this.selectedActivity = activity;
                this.editMode = false;
                })
            })
            .catch((error) =>  runInAction('edit activity error',() => console.error(error)))
            .finally(() => runInAction('edit activity finally',() => this.submitting = false));
    };

    @action deleteActivity = (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
        this.submitting = true;
        this.target = event.currentTarget.name;
        agent.Activities.delete(id)
            .then(() => 
                runInAction('delete activity then', () => {
                this.activityRegistry.delete(id);
                })
            )
            .catch((error) => runInAction('delete activity error',() => console.error(error)))
            .finally(() => 
                runInAction('edit activity finally',() => {
                    this.submitting = false;
                    this.target = '';
                }));
    };

    @action openCreateForm = () => {
        this.selectedActivity = undefined;
        this.editMode = true;
    };

    @action openEditForm = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = true;
    };

    @action selectActivity = (id: string) => {
        this.selectedActivity = this.activityRegistry.get(id);
        this.editMode = false;
    };

    @action cancelSelectedActivity = () => {
        this.selectedActivity = undefined;
    };

    @action cancelFormOpen = () => {
        this.editMode = false;
    };
}

export default createContext(new ActivityStore());