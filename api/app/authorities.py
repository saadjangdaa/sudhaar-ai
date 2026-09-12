"""
Karachi area -> responsible authority routing rules.

AREA_INDEX stays in Python because it is fuzzy-match reference data for the
router agent, not relational data. The authority CONTACT records live in the
public.authorities table (see supabase/seed_authorities.sql), keyed by the same
slugs used here.

There is no live civic API for Karachi, so this table is hand-seeded and
deliberately plausible rather than authoritative.
"""

import difflib
from typing import Optional, TypedDict

MUNICIPAL = "municipal"
CANTONMENT = "cantonment"


class Area(TypedDict):
    name: str
    jurisdiction: str


# 18 areas. Key = area_tag stored in the DB; name = what we show a human.
AREA_INDEX: dict[str, Area] = {
    "saddar":           {"name": "Saddar",            "jurisdiction": MUNICIPAL},
    "lyari":            {"name": "Lyari",             "jurisdiction": MUNICIPAL},
    "gulshan_e_iqbal":  {"name": "Gulshan-e-Iqbal",   "jurisdiction": MUNICIPAL},
    "north_nazimabad":  {"name": "North Nazimabad",   "jurisdiction": MUNICIPAL},
    "liaquatabad":      {"name": "Liaquatabad",       "jurisdiction": MUNICIPAL},
    "new_karachi":      {"name": "New Karachi",       "jurisdiction": MUNICIPAL},
    "orangi":           {"name": "Orangi Town",       "jurisdiction": MUNICIPAL},
    "site":             {"name": "S.I.T.E.",          "jurisdiction": MUNICIPAL},
    "keamari":          {"name": "Keamari",           "jurisdiction": MUNICIPAL},
    "korangi":          {"name": "Korangi",           "jurisdiction": MUNICIPAL},
    "landhi":           {"name": "Landhi",            "jurisdiction": MUNICIPAL},
    "shah_faisal":      {"name": "Shah Faisal",       "jurisdiction": MUNICIPAL},
    "gadap":            {"name": "Gadap",             "jurisdiction": MUNICIPAL},
    "bin_qasim":        {"name": "Bin Qasim",         "jurisdiction": MUNICIPAL},
    "gulberg":          {"name": "Gulberg",           "jurisdiction": MUNICIPAL},
    "clifton":          {"name": "Clifton",           "jurisdiction": CANTONMENT},
    "dha":              {"name": "DHA",               "jurisdiction": CANTONMENT},
    "malir":            {"name": "Malir",             "jurisdiction": CANTONMENT},
    "faisal_cantt":     {"name": "Faisal Cantonment", "jurisdiction": CANTONMENT},
}

# Which cantonment board covers which cantonment area.
CANTONMENT_BOARD: dict[str, str] = {
    "clifton":      "cbc",
    "dha":          "cbc",
    "malir":        "malir_cb",
    "faisal_cantt": "faisal_cb",
}

# Default owner by issue type, for ordinary municipal areas.
ISSUE_AUTHORITY: dict[str, str] = {
    "sewage":       "kwsb",
    "water":        "kwsb",
    "garbage":      "sswmb",
    "pothole":      "kmc",
    "encroachment": "tma",
}

AUTHORITY_SLUGS = ("kmc", "kwsb", "sswmb", "tma", "cbc", "malir_cb", "faisal_cb")

# Fallback display names, used only if the DB lookup fails. The authoritative
# copy lives in public.authorities.
AUTHORITY_NAMES: dict[str, str] = {
    "kmc":       "Karachi Metropolitan Corporation",
    "kwsb":      "Karachi Water & Sewerage Board",
    "sswmb":     "Sindh Solid Waste Management Board",
    "tma":       "Town Municipal Administration",
    "cbc":       "Cantonment Board Clifton",
    "malir_cb":  "Malir Cantonment Board",
    "faisal_cb": "Faisal Cantonment Board",
}


def match_area(area_input: Optional[str]) -> Optional[str]:
    """Best-effort map of free text to an AREA_INDEX key, without an LLM.

    Used as the fallback when the router agent is mocked or its answer is junk.
    """
    if not area_input:
        return None

    needle = area_input.strip().lower().replace("-", " ").replace(".", "")
    if not needle:
        return None

    # direct containment: catches "near Hassan Square, gulshan" -> gulshan_e_iqbal
    for key, area in AREA_INDEX.items():
        for candidate in (key.replace("_", " "), area["name"].lower()):
            if candidate in needle or needle in candidate:
                return key

    # then fuzzy, to survive typos
    flat = {k.replace("_", " "): k for k in AREA_INDEX}
    close = difflib.get_close_matches(needle, list(flat), n=1, cutoff=0.6)
    return flat[close[0]] if close else None


def route(issue_type: str, area_tag: Optional[str]) -> tuple[str, str]:
    """Return (authority_slug, human-readable reason).

    Rule order matters: a cantonment board owns *everything* inside its limits,
    regardless of issue type. That is the real jurisdictional quirk in Karachi and
    the reason routing is a table lookup rather than something the LLM decides.
    """
    if area_tag and AREA_INDEX.get(area_tag, {}).get("jurisdiction") == CANTONMENT:
        slug = CANTONMENT_BOARD.get(area_tag, "kmc")
        area_name = AREA_INDEX[area_tag]["name"]
        return slug, (
            f"{area_name} falls under cantonment administration, which handles all "
            f"municipal services within its limits."
        )

    slug = ISSUE_AUTHORITY.get(issue_type, "kmc")
    if area_tag and area_tag in AREA_INDEX:
        reason = (
            f"{issue_type.title()} complaints in {AREA_INDEX[area_tag]['name']} are "
            f"handled by {AUTHORITY_NAMES[slug]}."
        )
    else:
        reason = (
            f"Area could not be identified, so this was routed to "
            f"{AUTHORITY_NAMES[slug]} as the default owner of {issue_type} issues."
        )
    return slug, reason
