export interface PublicList {
  publicId: string;
  title: string | null;
  content: string;
  profileLinkUrl?: string | null;
  viewCount: string;
  importCount: string;
  created_at: Date;
  updated_at: Date;
}

export interface PublicLink {
  url: string;
  localId: string;
  title?: string | null;
}

export interface UserList extends PublicList {
  ownerId: string;
  localId: string;
  published: boolean;
}

export interface PublicListView extends PublicList {
  links: PublicLink[];
}
