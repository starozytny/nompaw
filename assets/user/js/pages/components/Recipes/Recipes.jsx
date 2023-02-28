import React from "react";

import { EyeOutlined, HeartOutlined } from "@ant-design/icons";
import { Avatar, Card } from "antd";

const { Meta } = Card;

export function Recipes () {
    return <div className="main-content">
        <div className="list-recipes">
            {new Array(20).fill(null).map((_, index) => (
                <Card
                    cover={
                        <img alt="example" src={`https://source.unsplash.com/random/?Food&${index}`} style={{ height: 260, objectFit: 'cover' }}/>
                    }
                    actions={[ <EyeOutlined key="voir"  />, <HeartOutlined key="favoris" /> ]}
                >
                    <Meta
                        avatar={<Avatar src="https://joesch.moe/api/v1/random" />}
                        title="Title"
                        description="Description"
                    />
                </Card>
            ))}
        </div>
    </div>
}