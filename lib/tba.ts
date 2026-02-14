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
