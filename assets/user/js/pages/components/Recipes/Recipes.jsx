import React from "react";

import {EditOutlined, EllipsisOutlined, EyeOutlined, HeartOutlined} from "@ant-design/icons";
import {Avatar, Card, Space} from "antd";

const { Meta } = Card;

export function Recipes () {
    return <div className="main-content">
        <div className="list-recipes">
            <Space size={[24, 24]} wrap>
                {new Array(20).fill(null).map((_, index) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Card
                        style={{ width: 300 }}
                        cover={
                            <img alt="example" src={`https://source.unsplash.com/random/&${index}`} style={{ height: 300, objectFit: 'cover' }}/>
                        }
                        actions={[ <EyeOutlined key="voir" />, <HeartOutlined key="favoris" /> ]}
                    >
                        <Meta
                            avatar={<Avatar src="https://joesch.moe/api/v1/random" />}
                            title="Title"
                            description="Description"
                        />
                    </Card>
                ))}
            </Space>
        </div>
    </div>
}