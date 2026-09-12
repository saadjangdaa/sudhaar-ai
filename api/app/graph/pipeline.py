"""LangGraph wiring: ingest -> classifier -> router -> drafter."""

from langgraph.graph import END, StateGraph

from app.graph.classifier import classifier_node, ingest_node
from app.graph.drafter import drafter_node
from app.graph.router import router_node
from app.graph.state import ReportState


def build_graph():
    graph = StateGraph(ReportState)

    graph.add_node("ingest", ingest_node)          # plumbing: audio -> transcript
    graph.add_node("classifier", classifier_node)  # agent 1
    graph.add_node("router", router_node)          # agent 2
    graph.add_node("drafter", drafter_node)        # agent 3

    graph.set_entry_point("ingest")
    graph.add_edge("ingest", "classifier")
    graph.add_edge("classifier", "router")
    graph.add_edge("router", "drafter")
    graph.add_edge("drafter", END)

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
