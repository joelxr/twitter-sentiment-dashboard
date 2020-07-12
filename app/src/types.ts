export interface Domain {
  id: number;
  name: string;
}
export interface ContextAnnotations {
  domain: Domain;
}

export interface Geo {
  place_id: number;
}

export interface Sample {
  id: number;
  created_at: string;
  text: string;
  author_id: number;
  in_reply_to_user_id: number;
  lang: string;
  context_annotations: Array<ContextAnnotations>;
  geo: Geo;
  score?: number;
}
