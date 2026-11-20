import React, { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";

import { TOPICS } from "@userPages/Invest/Formation/data";
import { EnveloppesTopic } from "@userPages/Invest/Formation/EnveloppesTopic";
import { ComingSoon } from "@userPages/Invest/Formation/ComingSoon";

const TOPIC_COMPONENTS = {
	enveloppes: EnveloppesTopic,
};

export function FormationTab () {
	const [active, setActive] = useState(TOPICS[0].key);

	return <Tabs value={active} onValueChange={setActive} className="flex flex-col gap-4">
		<TabsList className="self-start flex-wrap h-auto">
			{TOPICS.map(t => <TabsTrigger key={t.key} value={t.key}>{t.label}</TabsTrigger>)}
		</TabsList>

		{TOPICS.map(t => {
			const TopicComponent = TOPIC_COMPONENTS[t.key];
			return <TabsContent key={t.key} value={t.key}>
				{TopicComponent ? <TopicComponent /> : <ComingSoon label={t.label} />}
			</TabsContent>;
		})}
	</Tabs>;
}
