export interface DLSiteWork {
    workno: string;
    title: string;
    circle: string;
    cv?: string[];
    tags?: string[];
    release_date?: string;
    update_date?: string;
    dl_count?: number;
    age_rating?: string;
    music?: string[];
    file_size?: string;
    isGirls?: boolean;
}

export interface WorkInfo {
    rj: string;
    img?: string;
    title?: string;
    circle?: string;
    circleId?: string;
    date?: string;
    update?: string;
    rating?: string;
    tags?: { text: string; class?: string; onClick?: () => void }[];
    cv?: string;
    music?: string;
    filesize?: string;
    dateAnnounce?: string;
    is_announce?: boolean;
}

export interface WorkPromiseReturnData {
    api?: any;
    api2?: any;
    cien?: any;
    cien2?: any;
    trans?: any;
}

export interface PopupState {
    display: boolean;
    rjCode: string;
    isParent?: boolean;
    x: number;
    y: number;
    found: boolean;
    loading: boolean;
    pinned?: boolean;
}
