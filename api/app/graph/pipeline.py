"""
LangGraph wiring.

    ingest -> classifier -> validator -+-> router -> drafter -> END   (status 'pending')
                                       |
                                       +-> rejected -> END            (status 'rejected')

The validator branch is the point of the graph: a complaint that fails automated
review never reaches the router or the drafter, so a fake report costs two model
calls instead of four and no letter is ever written for it.
"""

from langgraph.graph import END, StateGraph

from app.graph.classifier import classifier_node, ingest_node
from app.graph.drafter import drafter_node
from app.graph.router import router_node
from app.graph.state import ReportState
from app.graph.validator import rejected_node, validator_node


def _after_validator(state: ReportState) -> str:
    """Route on the validator's verdict. Anything but an explicit reject proceeds."""
    return "rejected" if state.get("status") == "rejected" else "router"


def build_graph():
    graph = StateGraph(ReportState)

    graph.add_node("ingest", ingest_node)          # plumbing: audio -> transcript
    graph.add_node("classifier", classifier_node)  # what kind of issue is this
    graph.add_node("validator", validator_node)    # agent 1: is the complaint real
    graph.add_node("router", router_node)          # which authority owns it
    graph.add_node("drafter", drafter_node)        # agent 2 part 1: write the letter
    graph.add_node("rejected", rejected_node)      # terminal: nothing to route or draft

    graph.set_entry_point("ingest")
    graph.add_edge("ingest", "classifier")
    graph.add_edge("classifier", "validator")
    graph.add_conditional_edges(
        "validator",
        _after_validator,
        {"router": "router", "rejected": "rejected"},
    )
    graph.add_edge("router", "drafter")
    graph.add_edge("drafter", END)
    graph.add_edge("rejected", END)

    return graph.compile()


# Compiled once at import and reused for every request.
pipeline = build_graph()


async def run_pipeline(
    *,
    raw_text: str | None,
    media_url: str | None,
    media_type: str | None,
    area_input: str | None,
    language: str,
) -> ReportState:
    return await pipeline.ainvoke(
        {
            "raw_text": raw_text,
            "media_url": media_url,
            "media_type": media_type,
            "area_input": area_input,
            "language": language,
        }
    )
