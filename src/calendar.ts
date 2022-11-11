/**
 * Handles rendering the calendar given a container element, eventSources, and interaction callbacks.
 */
import {
	Calendar,
	EventApi,
	EventClickArg,
	EventHoveringArg,
	EventSourceInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import googleCalendarPlugin from "@fullcalendar/google-calendar";
import iCalendarPlugin from "@fullcalendar/icalendar";

interface ExtraRenderProps {
	eventClick?: (info: EventClickArg) => void;
	select?: (startDate: Date, endDate: Date, allDay: boolean) => Promise<void>;
	modifyEvent?: (event: EventApi, oldEvent: EventApi) => Promise<boolean>;
	eventMouseEnter?: (info: EventHoveringArg) => void;
	firstDay?: number;
	initialView?: { desktop: string; mobile: string };
	timeFormat24h?: boolean;
	openContextMenuForEvent?: (
		event: EventApi,
		mouseEvent: MouseEvent
	) => Promise<void>;
}

export function renderCalendar(
	containerEl: HTMLElement,
	eventSources: EventSourceInput[],
	settings?: ExtraRenderProps
): Calendar {
	const isMobile = window.innerWidth < 500;
	const {
		eventClick,
		select,
		modifyEvent,
		eventMouseEnter,
		openContextMenuForEvent,
	} = settings || {};
	console.log("sources to render", eventSources);
	const modifyEventCallback =
		modifyEvent &&
		(async ({
			event,
			oldEvent,
			revert,
		}: {
			event: EventApi;
			oldEvent: EventApi;
			revert: () => void;
		}) => {
			const success = await modifyEvent(event, oldEvent);
			if (!success) {
				revert();
			}
		});

	const cal = new Calendar(containerEl, {
		plugins: [
			// View plugins
			dayGridPlugin,
			timeGridPlugin,
			listPlugin,
			// Drag + drop and editing
			interactionPlugin,
			// Remote sources
			googleCalendarPlugin,
			iCalendarPlugin,
		],
		googleCalendarApiKey: "AIzaSyDIiklFwJXaLWuT_4y6I9ZRVVsPuf4xGrk",
		initialView:
			settings?.initialView?.[isMobile ? "mobile" : "desktop"] ||
			(isMobile ? "timeGrid3Days" : "timeGridWeek"),
		nowIndicator: true,
		scrollTimeReset: false,

		headerToolbar: !isMobile
			? {
					left: "prev,next today",
					center: "title",
					right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
			  }
			: false,
		footerToolbar: isMobile
			? {
					right: "today,prev,next",
					left: "timeGrid3Days,timeGridDay,listWeek",
			  }
			: false,

		views: {
			timeGridDay: {
				type: "timeGrid",
				duration: { days: 1 },
				buttonText: isMobile ? "1" : "day",
			},
			timeGrid3Days: {
				type: "timeGrid",
				duration: { days: 3 },
				buttonText: "3",
			},
		},
		firstDay: settings?.firstDay,
		...(settings?.timeFormat24h && {
			eventTimeFormat: {
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			},
			slotLabelFormat: {
				hour: "numeric",
				minute: "2-digit",
				hour12: false,
			},
		}),
		eventSources,
		eventClick,

		selectable: select && true,
		selectMirror: select && true,
		select:
			select &&
			(async (info) => {
				await select(info.start, info.end, info.allDay);
				info.view.calendar.unselect();
			}),

		editable: modifyEvent && true,
		eventDrop: modifyEventCallback,
		eventResize: modifyEventCallback,

		eventMouseEnter,

		eventDidMount: ({ event, el }) => {
			el.addEventListener("contextmenu", (e) => {
				e.preventDefault();
				openContextMenuForEvent && openContextMenuForEvent(event, e);
			});
		},

		longPressDelay: 250,
	});
	cal.render();
	return cal;
}
