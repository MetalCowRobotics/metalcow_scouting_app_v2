const TBA_BASE_URL = 'https://www.thebluealliance.com/api/v3';
const TBA_API_KEY = process.env.NEXT_PUBLIC_TBA_API_KEY;

export async function getTBAData(endpoint: string) {
    if (!TBA_API_KEY) {
        console.warn('TBA API key is missing. Please add NEXT_PUBLIC_TBA_API_KEY to your .env.local');
        // For development/demo purposes, we might return mock data or just fail
        throw new Error('TBA API key is missing');
    }

    const response = await fetch(`${TBA_BASE_URL}${endpoint}`, {
        headers: {
            'X-TBA-Auth-Key': TBA_API_KEY,
        },
    });

    if (!response.ok) {
        throw new Error(`TBA API error: ${response.statusText}`);
    }

    return response.json();
}

export interface TBATeam {
    key: string;
    team_number: number;
    nickname: string;
    name: string;
    city: string;
    state_prov: string;
    country: string;
    motto: string;
    rookie_year: number;
}

export interface TBAEvent {
    key: string;
    name: string;
    event_code: string;
    event_type: number;
    start_date: string;
    end_date: string;
    year: number;
    city: string;
    state_prov: string;
    country: string;
    location_name: string;
}

export interface TBAMatch {
    key: string;
    match_number: number;
    comp_level: string;
    set_number: number;
    alliances: {
        red: {
            score: number;
            team_keys: string[];
        };
        blue: {
            score: number;
            team_keys: string[];
        };
    };
    time: number;
    winning_alliance: string;
}

export interface TBATeamDetails {
    key: string;
    team_number: number;
    nickname: string;
    name: string;
    city: string;
    state_prov: string;
    country: string;
    motto: string;
    rookie_year: number;
    website?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    github?: string;
}

export interface TBATeamEvent {
    key: string;
    name: string;
    event_code: string;
    event_type: number;
    start_date: string;
    end_date: string;
    year: number;
}

export interface TBATeamRobot {
    year: number;
    key: string;
    name: string;
    team_key: string;
}

export interface TBATeamAward {
    award_type: number;
    event_key: string;
    name: string;
    recipient_list: {
        team_key: string;
        awardee?: string;
    }[];
    year: number;
}

export interface TBARanking {
    rank: number;
    team_key: string;
    wins: number;
    losses: number;
    ties: number;
    dp: number;
    tba_points: number;
}

export interface TBAAlliance {
    number: number;
    picks: string[];
    backup?: {
        in: string;
        out: string;
    };
    name?: string;
}

export interface TBAEventInsight {
    win_margin?: {
        average?: number;
        max?: number;
        min?: number;
    };
    auto_goals?: {
        cargo_balls?: number;
        panels?: number;
    };
    total_goals?: {
        cargo_balls?: number;
        panels?: number;
    };
    fouls?: {
        tech_fouls?: number;
        yellow_cards?: number;
        red_cards?: number;
    };
}

export interface TBAOPR {
    [teamKey: string]: number;
}

export interface TBADistrict {
    abbreviation: string;
    display_name: string;
    key: string;
    year: number;
}

export interface TBADistrictRanking {
    team_key: string;
    rank: number;
    rookie_points: number;
    points: number;
    event_points: {
        event_key: string;
        points: number;
        placement_points: number;
        qual_wins: number;
    }[];
}

export interface TBAStatus {
    current_season: number;
    is_events_view_enabled: boolean;
    is_match_scouting_enabled: boolean;
    is_pit_scouting_enabled: boolean;
    is_stale: boolean;
    is_website_up: boolean;
    max_season: number;
    pending_event_count: number;
}

export async function getTBATeamDetails(teamKey: string): Promise<TBATeamDetails> {
    return getTBAData(`/team/${teamKey}`)
}

export async function getTBATeamEvents(teamKey: string, year?: number): Promise<TBATeamEvent[]> {
    const endpoint = year ? `/team/${teamKey}/events/${year}` : `/team/${teamKey}/events`
    return getTBAData(endpoint)
}

export async function getTBATeamRobots(teamKey: string): Promise<TBATeamRobot[]> {
    return getTBAData(`/team/${teamKey}/robots`)
}

export async function getTBATeamAwards(teamKey: string, year?: number): Promise<TBATeamAward[]> {
    const endpoint = year ? `/team/${teamKey}/awards/${year}` : `/team/${teamKey}/awards`
    return getTBAData(endpoint)
}

export async function getTBAEventRankings(eventKey: string): Promise<unknown[]> {
    return getTBAData(`/event/${eventKey}/rankings`)
}

export async function getTBAEventAlliances(eventKey: string): Promise<TBAAlliance[]> {
    return getTBAData(`/event/${eventKey}/alliances`)
}

export async function getTBAEventInsights(eventKey: string): Promise<TBAEventInsight> {
    return getTBAData(`/event/${eventKey}/insights`)
}

export async function getTBAEventOPRs(eventKey: string): Promise<TBAOPR> {
    return getTBAData(`/event/${eventKey}/oprs`)
}

export async function getTBAEventDPRs(eventKey: string): Promise<TBAOPR> {
    return getTBAData(`/event/${eventKey}/dprs`)
}

export async function getTBAEventCCWMs(eventKey: string): Promise<TBAOPR> {
    return getTBAData(`/event/${eventKey}/ccwms`)
}

export async function getTBADistricts(year?: number): Promise<TBADistrict[]> {
    const endpoint = year ? `/districts/${year}` : `/districts`
    return getTBAData(endpoint)
}

export async function getTBADistrictEvents(districtKey: string, year: number): Promise<TBAEvent[]> {
    return getTBAData(`/district/${districtKey}/events/${year}`)
}

export async function getTBADistrictRankings(districtKey: string, year: number): Promise<TBADistrictRanking[]> {
    return getTBAData(`/district/${districtKey}/rankings/${year}`)
}

export async function getTBAStatus(): Promise<TBAStatus> {
    return getTBAData(`/status`)
}

export async function getTBATeamsByPage(pageNum: number, year?: number): Promise<TBATeam[]> {
    const endpoint = year ? `/teams/${year}/${pageNum}` : `/teams/${pageNum}`
    return getTBAData(endpoint)
}

export async function getTBAYearsParticipated(teamKey: string): Promise<number[]> {
    return getTBAData(`/team/${teamKey}/years_participated`)
}
